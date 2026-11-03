import express from "express";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { listAssignmentsByTeacher } from "../repos/assignments.js";
import { listClassesByFormTeacher, getClassById } from "../repos/classes.js";
import { listStudentsForSessionClass } from "../repos/students.js";
import { getSchoolSettings } from "../repos/config.js";
import { getSubjectById, listSubjects } from "../repos/subjects.js";
import { isReligiousStudiesAlias, normalizeLevel, RELIGIOUS_STUDIES_NAME } from "../subjectAliases.js";
import { isSubjectAvailableForClass } from "../subjectEligibility.js";

export const teacherScoreRosterRouter = express.Router();
teacherScoreRosterRouter.use(authRequired, requireRole(Roles.TEACHER));

const CORE_SSS_SUBJECTS = new Set([
  "MATHEMATICS",
  "ENGLISH LANGUAGE",
  "MARKETING",
  "CITIZENSHIP AND HERITAGE STUDIES",
  "ECONOMICS",
  "BIOLOGY",
  "CIVIC EDUCATION"
]);

const TRACK_SUBJECTS = {
  SCIENCE: ["CHEMISTRY", "PHYSICS"],
  ART: ["GOVERNMENT", "LITERATURE IN ENGLISH"],
  COMMERCIAL: ["FINANCIAL ACCOUNTING", "COMMERCE"]
};

function subjectIsReligious(subject) {
  return [subject?.name, subject?.originalName]
    .map((name) => String(name || "").trim())
    .some((name) => name === RELIGIOUS_STUDIES_NAME || isReligiousStudiesAlias(name));
}

async function getSubjectIdsIncludingAliases(subject) {
  if (!subjectIsReligious(subject)) return [String(subject.id)];
  const level = normalizeLevel(subject.level);
  const track = level === "SSS" ? (subject.track || "General") : (subject.track || "");
  const subjects = await listSubjects();
  return subjects
    .filter((candidate) => {
      const candidateLevel = normalizeLevel(candidate.level);
      const candidateTrack = candidateLevel === "SSS" ? (candidate.track || "General") : (candidate.track || "");
      return candidateLevel === level && candidateTrack === track && subjectIsReligious(candidate);
    })
    .map((candidate) => String(candidate.id));
}

function studentOffersSubject(student, cls, subject, subjectIds) {
  const selectedIds = Array.isArray(student.subjectIds) ? student.subjectIds.map(String) : [];
  if (subjectIds.some((id) => selectedIds.includes(id))) return true;

  const subjectName = String(subject.name || subject.originalName || "").trim().toUpperCase();
  const level = normalizeLevel(cls.level || cls.name);

  if (level === "SSS") {
    // These are compulsory for every SSS student, even when older records lack
    // explicit subjectIds.
    if (CORE_SSS_SUBJECTS.has(subjectName)) return true;

    const configuredTrack = String(subject.track || "").trim().toUpperCase();
    const nameTrack = Object.entries(TRACK_SUBJECTS)
      .find(([, names]) => names.includes(subjectName))?.[0];
    const requiredTrack = configuredTrack && configuredTrack !== "GENERAL" ? configuredTrack : nameTrack;
    if (requiredTrack) {
      const studentTrack = String(student.stream || cls.track || "").trim().toUpperCase();
      return studentTrack === requiredTrack;
    }

    // Electives require explicit selection; an empty legacy list must not make
    // an elective appear for every student.
    return false;
  }

  // Religious studies variants are selective in lower classes too. For other
  // legacy lower-school rosters, an empty subjectIds list means the class roster
  // follows the shared curriculum, preserving existing records.
  if (subjectIsReligious(subject)) return false;
  return selectedIds.length === 0;
}

async function getAuthorizedSubjectRoster({ req, res, classId, subjectId, session, term }) {
  if (!subjectId) {
    res.status(400).json({ error: "A subjectId is required to load a subject score roster." });
    return null;
  }

  const [cls, subject, assignments, formClasses] = await Promise.all([
    getClassById(classId),
    getSubjectById(subjectId),
    listAssignmentsByTeacher(req.user.username),
    listClassesByFormTeacher(req.user.username)
  ]);
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return null;
  }
  if (!subject || !isSubjectAvailableForClass(subject, cls)) {
    res.status(404).json({ error: "Subject not found for this class" });
    return null;
  }

  const subjectIds = await getSubjectIdsIncludingAliases(subject);
  const hasAssignment = assignments.some((assignment) =>
    assignment.classId === classId && subjectIds.includes(String(assignment.subjectId))
  );
  const isPrimaryOrNurseryFormTeacher = formClasses.some((formClass) =>
    formClass.id === classId && ["Primary", "Nursery"].includes(normalizeLevel(formClass.level))
  );
  if (!hasAssignment && !isPrimaryOrNurseryFormTeacher) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  const settings = await getSchoolSettings();
  const resolvedSession = session || String(settings?.currentSession || "").trim();
  const resolvedTerm = term || String(settings?.currentTerm || "").trim();
  const students = await listStudentsForSessionClass(classId, resolvedSession, resolvedTerm);
  return {
    class: cls,
    students: students.filter((student) => studentOffersSubject(student, cls, subject, subjectIds))
  };
}

// Keep the regular roster route intact for form-class workflows. Score entry
// sends subjectId and receives only students eligible for that subject.
teacherScoreRosterRouter.get(
  "/classes/:classId/students",
  asyncHandler(async (req, res, next) => {
    const subjectId = String(req.query.subjectId || "").trim();
    if (!subjectId) return next();

    const roster = await getAuthorizedSubjectRoster({
      req,
      res,
      classId: req.params.classId,
      subjectId,
      session: String(req.query.session || "").trim(),
      term: String(req.query.term || "").trim()
    });
    if (!roster) return;
    return res.json({ students: roster.students, class: roster.class, canAddStudents: false });
  })
);

// Apply the same eligibility check to writes so a stale or modified client
// cannot submit scores for students outside the selected subject roster.
teacherScoreRosterRouter.post(
  "/scores",
  asyncHandler(async (req, res, next) => {
    const body = req.body || {};
    if (!body.classId || !body.subjectId || !Array.isArray(body.scores)) return next();

    const roster = await getAuthorizedSubjectRoster({
      req,
      res,
      classId: String(body.classId),
      subjectId: String(body.subjectId),
      session: String(body.session || "").trim(),
      term: String(body.term || "").trim()
    });
    if (!roster) return;

    const eligibleStudentIds = new Set(roster.students.map((student) => String(student.studentId)));
    if (body.scores.some((score) => !eligibleStudentIds.has(String(score.studentId || "")))) {
      return res.status(400).json({ error: "Scores can only be entered for students who offer this subject." });
    }
    return next();
  })
);
