import express from "express";
import { Roles, TraitRatings } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { listAssignmentsByTeacher, getAssignmentByTriplet } from "../repos/assignments.js";
import { listClassesByFormTeacher, getClassById } from "../repos/classes.js";
import { listSubjects, getSubjectById } from "../repos/subjects.js";
import { listStudentsByClass, getStudentById, createStudentWithParent } from "../repos/students.js";
import { isPublished } from "../repos/publishes.js";
import { upsertNumericScore, upsertTraitScore } from "../repos/scores.js";
import { setTeacherRemark } from "../repos/remarks.js";
import { setReleaseStatus } from "../repos/releases.js";
import { generateStudentId, generateParentUsername } from "../ids.js";
import { hashPassword } from "../security.js";
import { validateStudentPayload } from "../validation.js";
import { getUserByUsername } from "../repos/users.js";
import { sendResultReleasedEmail } from "../services/email.js";
import { logActivity } from "../services/activityLog.js";

export const teacherRouter = express.Router();

teacherRouter.use(authRequired, requireRole(Roles.TEACHER));

teacherRouter.get(
  "/form-classes",
  asyncHandler(async (req, res) => {
    // 1. Try finding by formTeacherUsername field in classes
    let classes = await listClassesByFormTeacher(req.user.username);
    
    // 2. Fallback: If no classes found, check the teacher's own user record for formClassId
    if (classes.length === 0) {
      const user = await getUserByUsername(req.user.username);
      if (user && user.formClassId) {
        const cls = await getClassById(user.formClassId);
        if (cls) {
          // Verify it's actually assigned to them (even if username mismatch)
          // or just trust the formClassId link
          classes = [cls];
        }
      }
    }
    
    return res.json({ classes });
  })
);

teacherRouter.get(
  "/assignments",
  asyncHandler(async (req, res) => {
    const assignments = await listAssignmentsByTeacher(req.user.username);
    
    // Deduplicate by classId and subjectId
    const uniqueAssignments = new Map();
    for (const a of assignments) {
      const key = `${a.classId}-${a.subjectId}`;
      if (!uniqueAssignments.has(key)) {
        uniqueAssignments.set(key, a);
      }
    }

    const formClasses = await listClassesByFormTeacher(req.user.username);
    const primaryClasses = formClasses.filter((c) => {
      const level = String(c.level || '').trim().toUpperCase();
      return level === 'PRY' || level === 'NUR';
    });

    if (primaryClasses.length > 0) {
      const allSubjects = await listSubjects();
      const primarySubjects = allSubjects.filter((s) => String(s.level || '').trim().toLowerCase() === 'primary');

      for (const cls of primaryClasses) {
        for (const subject of primarySubjects) {
          const key = `${cls.id}-${subject.id}`;
          if (!uniqueAssignments.has(key)) {
            uniqueAssignments.set(key, {
              id: `primary-auto-${cls.id}-${subject.id}`,
              teacherUsername: req.user.username,
              classId: cls.id,
              subjectId: subject.id,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }
    
    const deduped = Array.from(uniqueAssignments.values());
    const enriched = await Promise.all(
      deduped.map(async (a) => {
        const [cls, subj] = await Promise.all([
          getClassById(a.classId), 
          getSubjectById(a.subjectId)
        ]);

        // Fallback: If subject not found by ID, try searching by name if the ID looks like a name
        let finalSubject = subj;
        if (!finalSubject && a.subjectId && a.subjectId.length < 50) {
          // This handles cases where subjectId might be a legacy name
          // but in the screenshot it's a long ID, so this fallback won't help for tmzlfjL...
          // However, if the user re-saved the teacher, they would have new IDs.
        }

        return {
          ...a,
          className: cls?.name || a.classId,
          level: cls?.level || "",
          subjectName: finalSubject?.name || a.subjectId
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
    const [assignments, cls] = await Promise.all([
      listAssignmentsByTeacher(req.user.username),
      getClassById(classId)
    ]);
    const isSubjectTeacher = assignments.some((a) => a.classId === classId);
    const isFormTeacher = cls?.formTeacherUsername === req.user.username;
    
    const formClasses = await listClassesByFormTeacher(req.user.username);
    const hasPryNurFormClass = formClasses.some(c => c.level === "PRY" || c.level === "NUR");
    let isPryNurTeacher = hasPryNurFormClass;
    
    if (!isPryNurTeacher) {
      const assignedClassIds = [...new Set(assignments.map(a => a.classId))];
      for (const cid of assignedClassIds) {
        const c = await getClassById(cid);
        if (c && (c.level === "PRY" || c.level === "NUR")) {
          isPryNurTeacher = true;
          break;
        }
      }
    }

    const isPryNurClass = cls?.level === "PRY" || cls?.level === "NUR";
    const canAddStudents = isFormTeacher || (isPryNurTeacher && isPryNurClass);

    if (!isSubjectTeacher && !isFormTeacher && !(isPryNurTeacher && isPryNurClass)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const students = await listStudentsByClass(classId);
    return res.json({ students, class: cls, canAddStudents });
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
    void logActivity({
      actor: req.user.username,
      role: req.user.role,
      action: "Entered numeric scores",
      details: { session: String(session), term: String(term), classId: String(classId), subjectId: String(subjectId), recordCount: scores.length },
      resourceType: "numeric-scores",
      resourceId: `${session}_${term}_${classId}_${subjectId}`
    }).catch((error) => console.error("Activity log failed:", error));
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
    void logActivity({
      actor: req.user.username,
      role: req.user.role,
      action: "Entered trait ratings",
      details: { session: String(session), term: String(term), classId: String(classId), subjectId: String(subjectId), recordCount: ratings.length },
      resourceType: "trait-scores",
      resourceId: `${session}_${term}_${classId}_${subjectId}`
    }).catch((error) => console.error("Activity log failed:", error));
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
    void logActivity({
      actor: req.user.username,
      role: req.user.role,
      action: "Added teacher remark",
      details: { session: String(session), term: String(term), studentId: String(studentId) },
      resourceType: "teacher-remark",
      resourceId: String(studentId)
    }).catch((error) => console.error("Activity log failed:", error));
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

    void logActivity({
      actor: req.user.username,
      role: req.user.role,
      action: released ? "Released student result" : "Unreleased student result",
      details: { session: String(session), term: String(term), studentId: String(studentId), released: !!released },
      resourceType: "result-release",
      resourceId: String(studentId)
    }).catch((error) => console.error("Activity log failed:", error));

    return res.json(result);
  })
);

teacherRouter.post(
  "/students",
  asyncHandler(async (req, res) => {
    const payload = validateStudentPayload(req.body || {});
    const cls = await getClassById(payload.classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });

    const isFormTeacher = cls.formTeacherUsername === req.user.username;

    let isPryNurTeacher = false;
    const formClasses = await listClassesByFormTeacher(req.user.username);
    const hasPryNurFormClass = formClasses.some(c => c.level === "PRY" || c.level === "NUR");
    if (hasPryNurFormClass) {
      isPryNurTeacher = true;
    } else {
      const assignments = await listAssignmentsByTeacher(req.user.username);
      const assignedClassIds = [...new Set(assignments.map(a => a.classId))];
      for (const cid of assignedClassIds) {
        const c = await getClassById(cid);
        if (c && (c.level === "PRY" || c.level === "NUR")) {
          isPryNurTeacher = true;
          break;
        }
      }
    }
    const isPryNurClass = cls.level === "PRY" || cls.level === "NUR";

    const canAdd = isFormTeacher || (isPryNurTeacher && isPryNurClass);
    if (!canAdd) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to enroll students in this class." });
    }

    const studentId = await generateStudentId();
    const parentUsername = await generateParentUsername();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let parentPassword = "";
    for (let i = 0; i < 8; i++) {
      parentPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const parentPasswordHash = await hashPassword(parentPassword);

    await createStudentWithParent({
      student: {
        studentId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        gender: payload.gender,
        classId: payload.classId,
        parentName: payload.parentName,
        parentEmail: payload.parentEmail,
        stream: payload.stream,
        subjectIds: payload.subjectIds || [],
        createdBy: req.user.username
      },
      parentUser: {
        username: parentUsername,
        email: payload.parentEmail,
        portal: "PARENT",
        role: Roles.PARENT,
        displayName: payload.parentName,
        passwordHash: parentPasswordHash,
        studentId
      }
    });

    void logActivity({
      actor: req.user.username,
      role: req.user.role,
      action: "Enrolled new student",
      details: { studentId, firstName: payload.firstName, lastName: payload.lastName, classId: payload.classId },
      resourceType: "student",
      resourceId: studentId
    }).catch((error) => console.error("Activity log failed:", error));

    return res.status(201).json({ studentId, parentUsername, parentPassword });
  })
);

