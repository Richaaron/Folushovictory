import express from "express";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { listAssignmentsByTeacher } from "../repos/assignments.js";
import { listClassesByFormTeacher, getClassById } from "../repos/classes.js";
import { listStudentsForSessionClass } from "../repos/students.js";
import { getSchoolSettings } from "../repos/config.js";
import { getSubjectById, listSubjects } from "../repos/subjects.js";
import { isReligiousStudiesAlias, normalizeLevel } from "../subjectAliases.js";
import { isSubjectAvailableForClass, getSubjectCategory } from "../subjectEligibility.js";
import { subjectIsReligious, studentOffersSubject } from "../subjectRoster.js";

export const teacherScoreRosterRouter = express.Router();
teacherScoreRosterRouter.use(authRequired, requireRole(Roles.TEACHER, Roles.ADMIN));

async function getSubjectIdsIncludingAliases(subject) {
  if (!subjectIsReligious(subject)) return [String(subject.id)];
  const level = normalizeLevel(subject.level);
  const track = level === "SSS" ? (subject.track || "General") : (subject.track || "");
  const subjects = await listSubjects();
  return subjects
    .filter((candidate) => {
      const candidateLevel = normalizeLevel(candidate.level);
      const candidateTrack = candidateLevel === "SSS" ? (candidate.track || "General") : (candidate.track || "");
      const candidateIsReligious = [candidate.name, candidate.originalName].some((name) =>
        isReligiousStudiesAlias(name) || String(name || "").trim().toUpperCase() === "RELIGIOUS STUDIES"
      );
      return candidateLevel === level && candidateTrack === track && candidateIsReligious;
    })
    .map((candidate) => String(candidate.id));
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
  const isAdmin = req.user.role === Roles.ADMIN;
  const isFormTeacher = cls.formTeacherUsername === req.user.username;

  if (!hasAssignment && !isPrimaryOrNurseryFormTeacher && !isAdmin && !isFormTeacher) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  const settings = await getSchoolSettings();
  const resolvedSession = session || String(settings?.currentSession || "").trim();
  const resolvedTerm = term || String(settings?.currentTerm || "").trim();
  const students = await listStudentsForSessionClass(classId, resolvedSession, resolvedTerm);
  const filtered = students.filter((student) => studentOffersSubject(student, cls, subject, subjectIds));
  const enriched = filtered.map((student) => ({
    ...student,
    id: student.studentId,
    name: `${student.firstName} ${student.lastName}`.trim(),
    subjectIds: Array.isArray(student.subjectIds) ? student.subjectIds : []
  }));

  return {
    class: cls,
    subject,
    subjectCategory: getSubjectCategory(subject, cls.level),
    allStudentsCount: students.length,
    canAddStudents: isFormTeacher || isAdmin,
    students: enriched
  };
}

// With no subjectId, continue to the legacy roster route used by form teachers.
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
    return res.json({
      students: roster.students,
      class: roster.class,
      subject: roster.subject,
      subjectCategory: roster.subjectCategory,
      allStudentsCount: roster.allStudentsCount,
      canAddStudents: roster.canAddStudents
    });
  })
);

// Apply the same eligibility check to writes so a stale or modified client
// cannot submit scores for students who are not enrolled in the subject.
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

    const eligibleIds = new Set(roster.students.map((student) => String(student.studentId)));
    if (body.scores.some((score) => !eligibleIds.has(String(score.studentId || "")))) {
      return res.status(400).json({ error: "Scores can only be entered for students who offer this subject." });
    }
    return next();
  })
);
