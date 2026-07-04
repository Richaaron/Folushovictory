import express from "express";
import { Roles, TraitRatings } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { listAssignmentsByTeacher, getAssignmentByTriplet } from "../repos/assignments.js";
import { listClassesByFormTeacher, getClassById } from "../repos/classes.js";
import { listSubjects, getSubjectById } from "../repos/subjects.js";
import { listStudentsByClass, getStudentById, createStudentWithParent, updateStudent } from "../repos/students.js";
import { validateStudentUpdatePayload, validateStudentPayload } from "../validation.js";
import { isPublished } from "../repos/publishes.js";
import { upsertNumericScore, upsertTraitScore } from "../repos/scores.js";
import { setTeacherRemark, listRemarksForStudents } from "../repos/remarks.js";
import { setReleaseStatus, listReleasesForClass } from "../repos/releases.js";
import { getSchoolSettings } from "../repos/config.js";
import { generateStudentId, generateParentUsername } from "../ids.js";
import { hashPassword } from "../security.js";
import { getUserByUsername, updateUser } from "../repos/users.js";
import { sendResultReleasedEmail } from "../services/email.js";
import { logActivity } from "../services/activityLog.js";
import { isReligiousStudiesAlias, normalizeLevel, RELIGIOUS_STUDIES_NAME } from "../subjectAliases.js";

export const teacherRouter = express.Router();

teacherRouter.use(authRequired, requireRole(Roles.TEACHER));

/**
 * Resolves a subjectId to its canonical ID.
 * For Religious Studies variants (IRS, CRS, or renamed "Religious Studies"),
 * all variants resolve to a single canonical subject ID.
 */
async function resolveScoreSubjectId(subjectId) {
  const selectedSubject = await getSubjectById(String(subjectId));
  if (!selectedSubject) return { subjectId: String(subjectId), aliasIds: [] };

  const selectedLevel = normalizeLevel(selectedSubject.level);
  const selectedTrack = selectedLevel === "SSS" ? (selectedSubject.track || "General") : (selectedSubject.track || "");
  const allSubjects = await listSubjects();
  const related = allSubjects.filter((subject) => {
    const subjectLevel = normalizeLevel(subject.level);
    const subjectTrack = subjectLevel === "SSS" ? (subject.track || "General") : (subject.track || "");
    const sameLevelAndTrack = subjectLevel === selectedLevel && subjectTrack === selectedTrack;
    const religiousName = subject.name === RELIGIOUS_STUDIES_NAME || isReligiousStudiesAlias(subject.originalName || subject.name);
    return sameLevelAndTrack && religiousName;
  });

  const canonical = related.find((subject) => subject.name === RELIGIOUS_STUDIES_NAME && !isReligiousStudiesAlias(subject.originalName || subject.name));
  const finalSubjectId = canonical?.id || selectedSubject.id;
  return {
    subjectId: finalSubjectId,
    aliasIds: related.map((subject) => subject.id).filter((id) => id && id !== finalSubjectId)
  };
}

/**
 * Checks whether a teacher is allowed to enter scores for a given subject in a class.
 * Handles the Religious Studies edge case where two teachers (IRS + CRS) share the
 * same canonical subject. If either teacher has an assignment for any religious-studies
 * variant in the class, both are allowed to enter scores.
 */
async function canTeacherEnterSubject({ teacherUsername, classId, subjectId, aliasIds = [] }) {
  // 1. Direct match: teacher assigned to the exact canonical subject in this class
  const direct = await getAssignmentByTriplet({ teacherUsername, classId, subjectId });
  if (direct) return true;

  const assignments = await listAssignmentsByTeacher(teacherUsername);
  const classAssignments = assignments.filter((a) => a.classId === classId);
  if (classAssignments.length === 0) return false;

  // 2. Alias match: teacher assigned to one of the known alias subject IDs
  if (aliasIds.length > 0 && classAssignments.some((a) => aliasIds.includes(a.subjectId))) return true;

  // 3. Religious Studies broadening: if the teacher has ANY assignment in this class for a
  //    subject that is (or was) a religious studies variant, and the target subject is also
  //    religious studies, allow entry. This handles the case where the admin normalised
  //    both the IRS and CRS teachers to the same canonical subject ID.
  const allSubjects = await listSubjects();
  const classAssignedSubjectIds = new Set(classAssignments.map((a) => a.subjectId));
  const hasReligiousAssignment = [...classAssignedSubjectIds].some((assignedSubjId) => {
    const s = allSubjects.find((sub) => sub.id === assignedSubjId);
    return s && (s.name === RELIGIOUS_STUDIES_NAME || isReligiousStudiesAlias(s.originalName || s.name));
  });
  const targetSubject = allSubjects.find((sub) => sub.id === subjectId);
  const targetIsReligious = targetSubject && (targetSubject.name === RELIGIOUS_STUDIES_NAME || isReligiousStudiesAlias(targetSubject.originalName || targetSubject.name));
  if (hasReligiousAssignment && targetIsReligious) return true;

  return false;
}

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
          classes = [cls];
        }
      }
    }
    
    return res.json({ classes });
  })
);

teacherRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await getUserByUsername(req.user.username);
    if (!user) return res.status(404).json({ error: "Teacher profile not found" });
    return res.json({
      username: user.username,
      role: user.role,
      displayName: user.displayName || "",
      signatureUrl: user.signatureUrl || "",
      formClassId: user.formClassId || null
    });
  })
);

teacherRouter.post(
  "/profile",
  asyncHandler(async (req, res) => {
    const { displayName, signatureUrl } = req.body || {};
    const patch = {};
    if (displayName !== undefined) patch.displayName = String(displayName).trim();
    if (signatureUrl !== undefined) patch.signatureUrl = String(signatureUrl).trim();
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No profile changes provided" });
    }

    const updated = await updateUser(req.user.username, patch);
    return res.json({
      username: updated.username,
      role: updated.role,
      displayName: updated.displayName || "",
      signatureUrl: updated.signatureUrl || "",
      formClassId: updated.formClassId || null
    });
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

        let finalSubject = subj;
        if (!finalSubject && a.subjectId && a.subjectId.length < 50) {
          // Fallback for legacy name-based IDs (no-op for normal IDs)
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
    const querySession = String(req.query.session || "").trim();
    const queryTerm = String(req.query.term || "").trim();

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

    const schoolSettings = (!querySession || !queryTerm) ? await getSchoolSettings() : null;
    const session = querySession || String(schoolSettings?.currentSession || "").trim();
    const term = queryTerm || String(schoolSettings?.currentTerm || "").trim();

    const students = await listStudentsByClass(classId);
    const studentIds = students.map((student) => String(student.studentId || "")).filter(Boolean);

    const [remarks, releaseStatuses] = await Promise.all([
      studentIds.length ? listRemarksForStudents({ session, term, studentIds }) : [],
      studentIds.length ? listReleasesForClass({ session, term, studentIds }) : {}
    ]);

    const remarkMap = remarks.reduce((acc, remark) => {
      acc[remark.studentId] = remark.teacherRemark || "";
      return acc;
    }, {});

    const enrichedStudents = students.map((student) => ({
      ...student,
      remark: remarkMap[student.studentId] || "",
      released: !!releaseStatuses[student.studentId]
    }));

    return res.json({ students: enrichedStudents, class: cls, canAddStudents });
  })
);

teacherRouter.post(
  "/scores",
  asyncHandler(async (req, res) => {
    const { session, term, classId, subjectId, scores } = req.body || {};
    if (!session || !term || !classId || !subjectId || !Array.isArray(scores))
      return res.status(400).json({ error: "Missing fields" });

    // Resolve canonical subject ID. For Religious Studies (IRS/CRS), this ensures
    // both the IRS teacher and the CRS teacher save under ONE canonical subjectId so
    // the broadsheet can display all students' scores under the same column.
    const resolvedSubject = await resolveScoreSubjectId(subjectId);
    const canEnter = await canTeacherEnterSubject({
      teacherUsername: req.user.username,
      classId: String(classId),
      subjectId: resolvedSubject.subjectId,
      aliasIds: [String(subjectId), ...resolvedSubject.aliasIds]
    });
    if (!canEnter) return res.status(403).json({ error: "Forbidden" });

    const locked = await isPublished({ classId: String(classId), session: String(session), term: String(term) });
    if (locked) return res.status(409).json({ error: "Results already published for this class" });

    // Always save with the canonical subjectId.
    // For Religious Studies: both teachers save under the same canonical column.
    // Each teacher enters scores for THEIR OWN students, so there is no per-student
    // overwrite conflict. For non-religious subjects this is the same as subjectId.
    const saveSubjectId = resolvedSubject.subjectId;

    const writes = scores.map(async (s) => {
      const studentId = String(s.studentId || "");
      const ca1 = Number(s.ca1 || 0);
      const ca2 = Number(s.ca2 || 0);
      const exam = Number(s.exam || 0);
      if (!studentId) throw Object.assign(new Error("Missing studentId"), { statusCode: 400 });
      
      if (ca1 > 20 || ca2 > 20) throw Object.assign(new Error("CA score cannot exceed 20"), { statusCode: 400 });
      if (exam > 60) throw Object.assign(new Error("Exam score cannot exceed 60"), { statusCode: 400 });
      const total = ca1 + ca2 + exam;
      if (total > 100) throw Object.assign(new Error("Total score cannot exceed 100"), { statusCode: 400 });

      await upsertNumericScore({
        session: String(session),
        term: String(term),
        classId: String(classId),
        studentId,
        subjectId: saveSubjectId,
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
      details: { session: String(session), term: String(term), classId: String(classId), subjectId: saveSubjectId, recordCount: scores.length },
      resourceType: "numeric-scores",
      resourceId: `${session}_${term}_${classId}_${saveSubjectId}`
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

    const resolvedSubject = await resolveScoreSubjectId(subjectId);
    const canEnter = await canTeacherEnterSubject({
      teacherUsername: req.user.username,
      classId: String(classId),
      subjectId: resolvedSubject.subjectId,
      aliasIds: [String(subjectId), ...resolvedSubject.aliasIds]
    });
    if (!canEnter) return res.status(403).json({ error: "Forbidden" });

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
        subjectId: resolvedSubject.subjectId,
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
    if (!student.classId) return res.status(400).json({ error: "Student record is missing classId" });
    const cls = await getClassById(student.classId);
    if (!cls || cls.formTeacherUsername !== req.user.username) {
      return res.status(403).json({ error: "Only the form teacher can release results" });
    }

    const result = await setReleaseStatus({
      session: String(session),
      term: String(term),
      studentId: String(studentId),
      classId: student.classId,
      released: !!released
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

teacherRouter.put(
  "/students/:studentId",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const patch = validateStudentUpdatePayload(req.body || {});
    const student = await getStudentById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const cls = await getClassById(student.classId);
    if (!cls) return res.status(404).json({ error: "Student class not found" });

    const isFormTeacher = cls.formTeacherUsername === req.user.username;
    const formClasses = await listClassesByFormTeacher(req.user.username);
    const hasPryNurFormClass = formClasses.some((c) => c.level === "PRY" || c.level === "NUR");
    let isPryNurTeacher = hasPryNurFormClass;

    if (!isPryNurTeacher) {
      const assignments = await listAssignmentsByTeacher(req.user.username);
      const assignedClassIds = [...new Set(assignments.map((a) => a.classId))];
      for (const cid of assignedClassIds) {
        const assignedClass = await getClassById(cid);
        if (assignedClass && (assignedClass.level === "PRY" || assignedClass.level === "NUR")) {
          isPryNurTeacher = true;
          break;
        }
      }
    }

    const isPryNurClass = cls.level === "PRY" || cls.level === "NUR";
    const canEdit = isFormTeacher || (isPryNurTeacher && isPryNurClass);
    if (!canEdit) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to update this student." });
    }

    if (patch.classId && patch.classId !== student.classId) {
      return res.status(403).json({ error: "Changing student class is not allowed." });
    }

    const updated = await updateStudent(studentId, patch);
    void logActivity({
      actor: req.user.username,
      role: req.user.role,
      action: "Updated student details",
      details: { studentId, classId: student.classId, changes: Object.keys(patch) },
      resourceType: "student",
      resourceId: studentId
    }).catch((error) => console.error("Activity log failed:", error));

    return res.json(updated);
  })
);
