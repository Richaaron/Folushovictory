import express from "express";
import { Roles, TraitRatings } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { listAssignmentsByTeacher, getAssignmentByTriplet } from "../repos/assignments.js";
import { listClassesByFormTeacher, getClassById } from "../repos/classes.js";
import { getSubjectById } from "../repos/subjects.js";
import { listStudentsByClass } from "../repos/students.js";
import { isPublished } from "../repos/publishes.js";
import { upsertNumericScore, upsertTraitScore } from "../repos/scores.js";
import { setTeacherRemark } from "../repos/remarks.js";
import { setReleaseStatus } from "../repos/releases.js";
import { getStudentById } from "../repos/students.js";
import { getUserByUsername } from "../repos/users.js";
import { sendResultReleasedEmail } from "../services/email.js";

export const teacherRouter = express.Router();

teacherRouter.use(authRequired, requireRole(Roles.TEACHER));

teacherRouter.get(
  "/form-classes",
  asyncHandler(async (req, res) => {
    const classes = await listClassesByFormTeacher(req.user.username);
    return res.json({ classes });
  })
);

teacherRouter.get(
  "/assignments",
  asyncHandler(async (req, res) => {
    const assignments = await listAssignmentsByTeacher(req.user.username);
    console.log(`[DEBUG] Teacher ${req.user.username}: Found ${assignments.length} total assignments from DB`);
    
    // Deduplicate by classId and subjectId
    const uniqueAssignments = new Map();
    for (const a of assignments) {
      const key = `${a.classId}-${a.subjectId}`;
      if (!uniqueAssignments.has(key)) {
        uniqueAssignments.set(key, a);
        console.log(`[DEBUG] Keeping: ${key}`);
      } else {
        console.log(`[DEBUG] Skipping duplicate: ${key}`);
      }
    }
    
    const deduped = Array.from(uniqueAssignments.values());
    console.log(`[DEBUG] After dedup: ${deduped.length} unique assignments`);
    
    const enriched = await Promise.all(
      deduped.map(async (a) => {
        const [cls, subj] = await Promise.all([getClassById(a.classId), getSubjectById(a.subjectId)]);
        return {
          ...a,
          className: cls?.name || a.classId,
          level: cls?.level || "",
          subjectName: subj?.name || a.subjectId
        };
      })
    );
    console.log(`[DEBUG] Returning enriched assignments:`, enriched.map(e => `${e.subjectName} (${e.className})`));
    return res.json({ assignments: enriched });
  })
);

teacherRouter.get(
  "/classes/:classId/students",
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const [assignments, cls] = await Promise.all([
      listAssignmentsByTeacher(req.user.username),
      getClassById(classId)
    ]);
    const isSubjectTeacher = assignments.some((a) => a.classId === classId);
    const isFormTeacher = cls?.formTeacherUsername === req.user.username;
    
    if (!isSubjectTeacher && !isFormTeacher) {
      return res.status(403).json({ error: "Forbidden" });
    }
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
      const ca1 = Number(s.ca1 || 0);
      const ca2 = Number(s.ca2 || 0);
      const exam = Number(s.exam || 0);
      if (!studentId) throw Object.assign(new Error("Missing studentId"), { statusCode: 400 });
      
      const total = ca1 + ca2 + exam;
      if (total > 100) throw Object.assign(new Error("Total score cannot exceed 100"), { statusCode: 400 });

      await upsertNumericScore({
        session: String(session),
        term: String(term),
        classId: String(classId),
        studentId,
        subjectId: String(subjectId),
        ca1,
        ca2,
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
    
    // Authorization check: Teacher must be form teacher of the class
    const student = await getStudentById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    const cls = await getClassById(student.classId);
    if (!cls || cls.formTeacherUsername !== req.user.username) {
      return res.status(403).json({ error: "Only the form teacher can add remarks" });
    }

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

teacherRouter.post(
  "/results/release",
  asyncHandler(async (req, res) => {
    const { session, term, studentId, released } = req.body || {};
    if (!session || !term || !studentId) return res.status(400).json({ error: "Missing fields" });

    // Authorization check: Teacher must be form teacher of the class
    const student = await getStudentById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    const cls = await getClassById(student.classId);
    if (!cls || cls.formTeacherUsername !== req.user.username) {
      return res.status(403).json({ error: "Only the form teacher can release results" });
    }

    const result = await setReleaseStatus({
      session: String(session),
      term: String(term),
      studentId: String(studentId),
      released: !!released,
      releasedBy: req.user.username
    });

    // Optional: Send email notification if released
    if (!!released) {
      (async () => {
        try {
          if (student.parentUsername) {
            const parent = await getUserByUsername(student.parentUsername);
            if (parent && parent.email) {
              await sendResultReleasedEmail({
                parentEmail: parent.email,
                parentName: parent.displayName,
                studentName: `${student.firstName} ${student.lastName}`,
                session: String(session),
                term: String(term)
              });
            }
          }
        } catch (err) {
          console.error("Failed to send release notification email:", err);
        }
      })();
    }

    return res.json(result);
  })
);

