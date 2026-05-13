import express from "express";
import { Roles } from "../constants.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { getClassById } from "../repos/classes.js";
import { listStudentsByClass, getStudentById } from "../repos/students.js";
import { listScoresForClass, listScoresForStudent } from "../repos/scores.js";
import { getGradingScale, getTermMeta, getSchoolSettings } from "../repos/config.js";
import { numericBroadsheet, traitSheet } from "../compute.js";
import { listSubjects, getSubjectById } from "../repos/subjects.js";
import { getRemarks } from "../repos/remarks.js";
import { getPublish } from "../repos/publishes.js";
import { listAssignmentsByTeacher } from "../repos/assignments.js";
import { getUserByUsername } from "../repos/users.js";
import { getReleaseStatus } from "../repos/releases.js";

export const resultsRouter = express.Router();

resultsRouter.use(authRequired);

async function subjectsForClass(cls) {
  if (Array.isArray(cls.subjectIds) && cls.subjectIds.length) {
    const subs = await Promise.all(cls.subjectIds.map((id) => getSubjectById(id)));
    return subs.filter(Boolean).map((s) => ({ id: s.id, name: s.name }));
  }
  
  const all = await listSubjects();
  // Map class level codes to subject level names
  let levelFilter = cls.level;
  if (levelFilter === 'PRY') levelFilter = 'Primary';
  
  // If no subjects assigned, return subjects matching the class level
  // to avoid showing JSS subjects in SSS sheets and vice versa
  return all
    .filter(s => s.level === levelFilter)
    .map((s) => ({ id: s.id, name: s.name }));
}

resultsRouter.get(
  "/class/:classId/broadsheet",
  asyncHandler(async (req, res) => {
    if (req.user.role !== Roles.ADMIN) return res.status(403).json({ error: "Forbidden" });
    const { classId } = req.params;
    const { session, term } = req.query;
    if (!session || !term) return res.status(400).json({ error: "Missing session/term" });

    const cls = await getClassById(classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });

    const [students, subjects, scores, scale, publish] = await Promise.all([
      listStudentsByClass(classId),
      subjectsForClass(cls),
      listScoresForClass({ session: String(session), term: String(term), classId }),
      getGradingScale(),
      getPublish({ classId, session: String(session), term: String(term) })
    ]);

    const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));

    const sheet =
      String(cls.assessmentType).toUpperCase() === "TRAIT"
        ? traitSheet({ students, subjects, scoresByKey })
        : numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

    return res.json({
      class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
      session: String(session),
      term: String(term),
      published: Boolean(publish),
      ...sheet
    });
  })
);

resultsRouter.get(
  "/student/:studentId/report",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { session, term } = req.query;
    if (!session || !term) return res.status(400).json({ error: "Missing session/term" });

    const student = await getStudentById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (req.user.role === Roles.PARENT) {
      if (!req.user.studentId || req.user.studentId !== studentId) return res.status(403).json({ error: "Forbidden" });
    }

    if (req.user.role === Roles.TEACHER) {
      const assignments = await listAssignmentsByTeacher(req.user.username);
      const allowed = assignments.some((a) => a.classId === student.classId);
      if (!allowed) return res.status(403).json({ error: "Forbidden" });
    }

    const cls = await getClassById(student.classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });

    const [subjects, scale, remarks, meta, publish, school, release] = await Promise.all([
      subjectsForClass(cls),
      getGradingScale(),
      getRemarks({ session: String(session), term: String(term), studentId }),
      getTermMeta({ session: String(session), term: String(term) }),
      getPublish({ classId: student.classId, session: String(session), term: String(term) }),
      getSchoolSettings(),
      getReleaseStatus({ session: String(session), term: String(term), studentId })
    ]);

    const isReleased = release.released;

    let formTeacher = null;
    if (cls.formTeacherUsername) {
      formTeacher = await getUserByUsername(cls.formTeacherUsername);
    }

    let row;
    let cumulative = null;
    
    if (String(cls.assessmentType).toUpperCase() === "TRAIT") {
      const scores = await listScoresForStudent({ session: String(session), term: String(term), studentId });
      const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
      row = traitSheet({ students: [student], subjects, scoresByKey }).students[0];
    } else {
      const scores = await listScoresForClass({ session: String(session), term: String(term), classId: student.classId });
      const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
      const studentsInClass = await listStudentsByClass(student.classId);
      const sheet = numericBroadsheet({ students: studentsInClass, subjects, scoresByKey, scale, level: cls.level });
      row = sheet.students.find((s) => s.studentId === studentId);

      // Cumulative Logic
      if (term === "2nd" || term === "3rd") {
        const termsToFetch = term === "2nd" ? ["1st"] : ["1st", "2nd"];
        const prevResults = await Promise.all(termsToFetch.map(async (t) => {
            const pScores = await listScoresForClass({ session: String(session), term: t, classId: student.classId });
            const pScoresByKey = new Map(pScores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
            const pSheet = numericBroadsheet({ students: studentsInClass, subjects, scoresByKey: pScoresByKey, scale, level: cls.level });
            return { term: t, result: pSheet.students.find((s) => s.studentId === studentId) };
        }));
        
        cumulative = {
            previousTerms: prevResults.filter(r => !!r.result).map(r => ({
                term: r.term,
                total: r.result.total,
                average: r.result.average
            }))
        };
        
        if (cumulative.previousTerms.length > 0 && row) {
            const allTotals = [...cumulative.previousTerms.filter(r => r.total !== undefined).map(r => r.total), row.total];
            if (allTotals.length > 0) {
              cumulative.sessionTotal = allTotals.reduce((a, b) => a + b, 0);
              cumulative.sessionAverage = (cumulative.sessionTotal / allTotals.length).toFixed(2);
            }
        }
      }
    }

    return res.json({
      school,
      formTeacher: formTeacher ? { displayName: formTeacher.displayName || formTeacher.username } : null,
      released: isReleased,
      cumulative,
      class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
      student: { studentId: student.studentId, firstName: student.firstName, lastName: student.lastName, gender: student.gender || "" },
      session: String(session),
      term: String(term),
      published: Boolean(publish),
      resumptionDate: meta?.resumptionDate || "",
      teacherRemark: remarks?.teacherRemark || "",
      principalRemark: remarks?.principalRemark || "",
      result: row
    });
  })
);

