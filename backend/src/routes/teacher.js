import express from "express";
import { Roles, TraitRatings } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { listAssignmentsByTeacher, getAssignmentByTriplet } from "../repos/assignments.js";
import { getClassById } from "../repos/classes.js";
import { getSubjectById } from "../repos/subjects.js";
import { listStudentsByClass } from "../repos/students.js";
import { isPublished } from "../repos/publishes.js";
import { upsertNumericScore, upsertTraitScore } from "../repos/scores.js";
import { setTeacherRemark } from "../repos/remarks.js";

export const teacherRouter = express.Router();

teacherRouter.use(authRequired, requireRole(Roles.TEACHER));

teacherRouter.get(
  "/assignments",
  asyncHandler(async (req, res) => {
    const assignments = await listAssignmentsByTeacher(req.user.username);
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const [cls, subj] = await Promise.all([getClassById(a.classId), getSubjectById(a.subjectId)]);
        return {
          ...a,
          className: cls?.name || a.classId,
          subjectName: subj?.name || a.subjectId
        };
      })
    );
    return res.json({ assignments: enriched });
  })
);

teacherRouter.get(
  "/classes/:classId/students",
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const assignments = await listAssignmentsByTeacher(req.user.username);
    const allowed = assignments.some((a) => a.classId === classId);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
    const students = await listStudentsByClass(classId);
    return res.json({ students });
  })
);

teacherRouter.post(
  "/scores",
  asyncHandler(async (req, res) => {
    const { session, term, classId, subjectId, scores } = req.body || {};
    if (!session || !term || !classId || !subjectId || !Array.isArray(scores))
      return res.status(400).json({ error: "Missing fields" });

    const assignment = await getAssignmentByTriplet({
      teacherUsername: req.user.username,
      classId: String(classId),
      subjectId: String(subjectId)
    });
    if (!assignment) return res.status(403).json({ error: "Forbidden" });

    const locked = await isPublished({ classId: String(classId), session: String(session), term: String(term) });
    if (locked) return res.status(409).json({ error: "Results already published for this class" });

    const writes = scores.map(async (s) => {
      const studentId = String(s.studentId || "");
      const ca = Number(s.ca);
      const exam = Number(s.exam);
      if (!studentId) throw Object.assign(new Error("Missing studentId"), { statusCode: 400 });
      if (!Number.isFinite(ca) || !Number.isFinite(exam)) throw Object.assign(new Error("Invalid score"), { statusCode: 400 });
      if (ca < 0 || ca > 40 || exam < 0 || exam > 60) throw Object.assign(new Error("Score out of range"), { statusCode: 400 });

      await upsertNumericScore({
        session: String(session),
        term: String(term),
        classId: String(classId),
        studentId,
        subjectId: String(subjectId),
        ca,
        exam,
        enteredBy: req.user.username
      });
    });

    await Promise.all(writes);
    return res.json({ ok: true });
  })
);

teacherRouter.post(
  "/traits",
  asyncHandler(async (req, res) => {
    const { session, term, classId, subjectId, ratings } = req.body || {};
    if (!session || !term || !classId || !subjectId || !Array.isArray(ratings))
      return res.status(400).json({ error: "Missing fields" });

    const assignment = await getAssignmentByTriplet({
      teacherUsername: req.user.username,
      classId: String(classId),
      subjectId: String(subjectId)
    });
    if (!assignment) return res.status(403).json({ error: "Forbidden" });

    const locked = await isPublished({ classId: String(classId), session: String(session), term: String(term) });
    if (locked) return res.status(409).json({ error: "Results already published for this class" });

    const allowedRatings = new Set(Object.values(TraitRatings));

    const writes = ratings.map(async (r) => {
      const studentId = String(r.studentId || "");
      const rating = String(r.rating || "");
      if (!studentId) throw Object.assign(new Error("Missing studentId"), { statusCode: 400 });
      if (!allowedRatings.has(rating)) throw Object.assign(new Error("Invalid rating"), { statusCode: 400 });
      await upsertTraitScore({
        session: String(session),
        term: String(term),
        classId: String(classId),
        studentId,
        subjectId: String(subjectId),
        rating,
        enteredBy: req.user.username
      });
    });

    await Promise.all(writes);
    return res.json({ ok: true });
  })
);

teacherRouter.post(
  "/remarks",
  asyncHandler(async (req, res) => {
    const { session, term, studentId, teacherRemark } = req.body || {};
    if (!session || !term || !studentId) return res.status(400).json({ error: "Missing fields" });
    await setTeacherRemark({
      session: String(session),
      term: String(term),
      studentId: String(studentId),
      teacherRemark: teacherRemark ? String(teacherRemark) : "",
      setBy: req.user.username
    });
    return res.json({ ok: true });
  })
);

