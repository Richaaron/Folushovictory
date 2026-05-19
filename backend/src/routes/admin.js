import express from "express";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { generateTeacherUsername, generateStudentId, generateParentUsername } from "../ids.js";
import { generateRandomPassword, hashPassword } from "../security.js";
import { createUser, deleteUser, getUserByUsername, updateUser } from "../repos/users.js";
import { createStudent, createStudentWithParent, listStudentsByClass, updateStudent, deleteStudent, getStudentById } from "../repos/students.js";
import { createClass, listClasses, updateClass, getClassById, revokeFormTeacherStatus } from "../repos/classes.js";
import { validateTeacherPayload, validateStudentPayload, validateStudentUpdatePayload } from "../validation.js";
import { createSubject, listSubjects, getSubjectById } from "../repos/subjects.js";
import { createAssignment, deleteAssignmentsByTeacher } from "../repos/assignments.js";
import { upsertNumericScore, listScoresForStudent } from "../repos/scores.js";
import { getGradingScale, setGradingScale, setTermMeta, getSchoolSettings, setSchoolSettings } from "../repos/config.js";
import { setReleaseStatus } from "../repos/releases.js";
import { publishResults, getPublish } from "../repos/publishes.js";
import { setPrincipalRemark, setTeacherRemark } from "../repos/remarks.js";
import { getDb } from "../firebase.js";
import { sendEmail, sendResultReleasedEmail } from "../services/email.js";
import { logActivity } from "../services/activityLog.js";
import { performHealthCheck, validateDataIntegrity, getCollectionMetrics } from "../firestore-utils/index.js";

export const adminRouter = express.Router();

// ==========================================
// ADMIN ACCESS POLICY
// ==========================================
// The Admin role has UNRESTRICTED access to all classes, students, and operations
// regardless of form teacher assignment status.
//
// Key principles:
// - Admins can manage ALL classes even if no form teacher is assigned
// - Admins can access student data for ANY class
// - Admins can publish results for ANY class without teacher approval
// - Admins can add remarks (teacher/principal) for ANY student
// - Admins can release results for ANY student
// - No operation should check or restrict based on formTeacherUsername for admins
// ==========================================

adminRouter.use(authRequired, requireRole(Roles.ADMIN));

// ==========================================
// HEALTH AND MONITORING ENDPOINTS
// ==========================================

adminRouter.get(
  "/health/database",
  asyncHandler(async (req, res) => {
    const [health, integrity, metrics] = await Promise.all([
      performHealthCheck(),
      validateDataIntegrity(),
      getCollectionMetrics()
    ]);

    const isHealthy = health.status === "healthy" && integrity.issuesFound === 0;
    const status = isHealthy ? 200 : 207; // 207 Multi-Status if issues found

    res.status(status).json({
      database: health,
      dataIntegrity: integrity,
      metrics: metrics.metrics,
      timestamp: new Date().toISOString()
    });
  })
);

adminRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const { session, term } = req.query;
    const db = getDb();
    const [studentsSnap, teachersSnap, classes, schoolSettings] = await Promise.all([
      db.collection("students").get(),
      db.collection("users").where("role", "==", Roles.TEACHER).get(),
      listClasses(),
      getSchoolSettings()
    ]);

    const activeTerm = {
      session: schoolSettings.currentSession,
      term: schoolSettings.currentTerm
    };
    const currentSession = session || activeTerm.session;
    const currentTerm = term || activeTerm.term;

    // Calculate "New This Term" (last 30 days for now)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const students = studentsSnap.docs.map(d => d.data());
    const newThisTerm = students.filter(s => s.createdAt && new Date(s.createdAt) > thirtyDaysAgo).length;

    // Calculate "Awaiting Results"
    // Fetch all publishes for current term
    const pubSnap = await db.collection("publishes")
      .where("session", "==", String(currentSession))
      .where("term", "==", String(currentTerm))
      .get();
    const publishedClassIds = new Set(pubSnap.docs.map(d => d.data().classId));
    
    const awaitingResults = students.filter(s => !publishedClassIds.has(s.classId)).length;

    let resultStatus = [];
    if (session && term) {
      const statuses = await Promise.all(
        classes.map(async (c) => {
          const published = publishedClassIds.has(c.id);
          return { classId: c.id, className: c.name, published };
        })
      );
      resultStatus = statuses;
    }

    return res.json({
      counts: {
        students: studentsSnap.size,
        teachers: teachersSnap.size,
        classes: classes.length,
        newThisTerm,
        awaitingResults
      },
      resultStatus,
      activeTerm
    });
  })
);

adminRouter.post(
  "/teachers",
  asyncHandler(async (req, res) => {
    const payload = validateTeacherPayload(req.body || {});
    const username = await generateTeacherUsername();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const passwordHash = await hashPassword(password);

    // Create user with username as document ID for proper lookup
    await createUser({
      username,
      email: payload.email,
      portal: "TEACHER",
      role: Roles.TEACHER,
      displayName: payload.displayName,
      passwordHash
    }, { docId: username });

    let emailSent = false;
    let emailError = null;

    if (payload.email) {
      const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #5D3FD3; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
            </div>
            <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
              <h2 style="margin-top: 0; color: #5D3FD3;">Welcome, ${payload.displayName}!</h2>
              <p>Your academic staff portal account has been created successfully. You can now manage your classes, subjects, and results digitally.</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">Login Credentials</p>
                <p style="margin: 10px 0 0; font-size: 16px;"><strong>Username:</strong> <span style="color: #0B6E4F;">${username}</span></p>
                <p style="margin: 5px 0 0; font-size: 16px;"><strong>Temporary Password:</strong> <span style="color: #0B6E4F;">${password}</span></p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/login/teacher" 
                   style="background-color: #D4AF37; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                   Access Staff Portal
                </a>
              </div>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 16px;">
                This is an automated security message. Please do not share your credentials with anyone.
              </p>
            </div>
          </div>
        `;

      // Send email in background to avoid blocking the request
      sendEmail({
        to: payload.email,
        subject: "Your FVS Teacher Portal Credentials",
        html: emailHtml
      }).then(() => {
        console.log(`✅ Welcome email sent successfully to ${payload.email}`);
      }).catch(err => {
        console.error(`❌ Failed to send teacher email to ${payload.email}:`, err?.message || err);
      });
      emailSent = true; // Assume true since we fired it off
    }

    return res.status(201).json({ 
      username, 
      password,
      email: payload.email || null,
      emailSent,
      emailError,
      message: "✅ Account created successfully! Credentials will be emailed shortly."
    });
  })
);

adminRouter.post(
  "/teachers/:username/resend-credentials",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    if (!user) return res.status(404).json({ error: "Teacher not found" });
    if (!user.email) return res.status(400).json({ error: "Teacher has no email address" });

    // Generate new random password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const passwordHash = await hashPassword(password);

    // Update user record with new password
    await updateUser(username, { passwordHash });

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #5D3FD3; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
        </div>
        <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #5D3FD3;">Hello ${user.displayName}!</h2>
          <p>Your academic staff portal credentials have been reset at your request or by an administrator.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">New Login Credentials</p>
            <p style="margin: 10px 0 0; font-size: 16px;"><strong>Username:</strong> <span style="color: #0B6E4F;">${username}</span></p>
            <p style="margin: 5px 0 0; font-size: 16px;"><strong>Temporary Password:</strong> <span style="color: #0B6E4F;">${password}</span></p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/login/teacher" 
               style="background-color: #D4AF37; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
               Access Staff Portal
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 16px;">
            This is an automated security message. Please do not share your credentials with anyone.
          </p>
        </div>
      </div>
    `;

    // Wait for email to send so we can report failure immediately
    try {
      await sendEmail({
        to: user.email,
        subject: "FVS: Your Teacher Portal Credentials",
        html: emailHtml
      });
      return res.json({ 
        success: true, 
        message: `✅ New credentials sent to ${user.email}`,
        password // Also return it so admin can copy it manually
      });
    } catch (err) {
      console.error("Failed to resend credentials:", err);
      return res.status(500).json({ 
        error: "Failed to send email. However, the password was reset.",
        password // Still return it so admin can provide it manually
      });
    }
  })
);

adminRouter.put(
  "/teachers/:username",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { displayName, email, formClassId } = req.body || {};
    
    // 1. Update User Record
    const updated = await updateUser(username, { 
      ...(displayName ? { displayName: String(displayName) } : {}),
      ...(email ? { email: String(email) } : {})
    });

    // 2. Handle Form Teacher Revocation/Assignment
    if (formClassId !== undefined) {
      await revokeFormTeacherStatus(username);
      if (formClassId) {
        await updateClass(formClassId, { formTeacherUsername: username });
      }
    }

    // 3. Handle Atomic Assignment Replacement
    const { classIds, subjectIds } = req.body || {};
    if (Array.isArray(classIds) && Array.isArray(subjectIds)) {
      await deleteAssignmentsByTeacher(username);
      const assignments = [];
      
      // Fetch all subjects to determine their levels
      const subjectDocs = await Promise.all(subjectIds.filter(id => !!id).map(id => getSubjectById(id)));
      const subjectMap = Object.fromEntries(subjectDocs.filter(s => !!s).map(s => [s.id, s]));
      
      // Determine all required levels from the subjects
      const requiredLevels = new Set();
      for (const sId of subjectIds) {
        if (subjectMap[sId]?.level) {
          requiredLevels.add(subjectMap[sId].level);
        }
      }
      
      // Fetch ALL classes and filter to those matching the required levels
      const allClasses = await listClasses();
      const targetClasses = allClasses.filter(cls => requiredLevels.has(cls.level));
      
      // Create assignments for ALL classes at the subject's level
      for (const cls of targetClasses) {
        for (const sId of subjectIds) {
          if (subjectMap[sId]?.level === cls.level) {
            assignments.push(createAssignment({
              teacherUsername: username,
              classId: cls.id,
              subjectId: sId,
              createdAt: new Date().toISOString()
            }));
          }
        }
      }
      
      if (assignments.length > 0) await Promise.all(assignments);
    }

    return res.json(updated);
  })
);

adminRouter.delete(
  "/teachers/:username",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    await deleteUser(username);
    return res.json({ success: true });
  })
);

adminRouter.get(
  "/teachers",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const snap = await db.collection("users").where("role", "==", Roles.TEACHER).get();
    
    const teachers = await Promise.all(snap.docs.map(async (d) => {
      const u = d.data();
      const username = u.username;
      
      // Fetch assignments
      const assignSnap = await db.collection("assignments").where("teacherUsername", "==", username).get();
      const assignedSubjectIds = [...new Set(assignSnap.docs.map(doc => doc.data().subjectId))];
      const selectedClassIds = [...new Set(assignSnap.docs.map(doc => doc.data().classId))];
      
      // Fetch form class
      const classSnap = await db.collection("classes").where("formTeacherUsername", "==", username).get();
      const formClassId = classSnap.docs[0]?.id || "";
      
      return { 
        username, 
        displayName: u.displayName || "", 
        email: u.email || "",
        assignedSubjectIds,
        selectedClassIds,
        formClassId
      };
    }));

    // Sort in memory
    teachers.sort((a, b) => a.username.localeCompare(b.username));
    return res.json({ teachers });
  })
);

adminRouter.post(
  "/students",
  asyncHandler(async (req, res) => {
    const payload = validateStudentPayload(req.body || {});
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

    return res.status(201).json({ studentId, parentUsername, parentPassword });
  })
);

adminRouter.put(
  "/students/:studentId",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const patch = validateStudentUpdatePayload(req.body || {});
    const updated = await updateStudent(studentId, patch);
    return res.json(updated);
  })
);

adminRouter.delete(
  "/students/:studentId",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    // Find parent user to delete as well
    const db = getDb();
    const parentSnap = await db.collection("users")
      .where("role", "==", Roles.PARENT)
      .where("studentId", "==", studentId)
      .get();
    
    for (const doc of parentSnap.docs) {
      await deleteUser(doc.id);
    }

    await deleteStudent(studentId);
    return res.json({ success: true });
  })
);

// GET scores for a specific student
adminRouter.get(
  "/students/:studentId/scores",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { session, term } = req.query;
    
    if (!session || !term) {
      return res.status(400).json({ error: "Missing session or term query parameter" });
    }

    const scores = await listScoresForStudent({ 
      session: String(session), 
      term: String(term), 
      studentId: String(studentId) 
    });
    
    return res.json({ scores });
  })
);

// POST/UPSERT scores for a student
adminRouter.post(
  "/students/:studentId/scores",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { session, term, classId, scores } = req.body || {};
    
    if (!session || !term || !classId || !Array.isArray(scores)) {
      return res.status(400).json({ error: "Missing required fields: session, term, classId, scores" });
    }

    // Upsert all scores for this student
    const enteredBy = req.user?.username || "admin";
    
    for (const score of scores) {
      const { subjectId, ca1, ca2, exam } = score;
      if (!subjectId) continue;
      
      await upsertNumericScore({
        session: String(session),
        term: String(term),
        classId: String(classId),
        studentId: String(studentId),
        subjectId: String(subjectId),
        ca1: Number(ca1 || 0),
        ca2: Number(ca2 || 0),
        exam: Number(exam || 0),
        enteredBy
      });
    }

    return res.json({ 
      success: true, 
      message: `Scores saved for ${scores.length} subject(s)` 
    });
  })
);

adminRouter.get(
  "/students",
  asyncHandler(async (req, res) => {
    const { classId } = req.query;
    const db = getDb();
    let students = [];
    try {
      let q = db.collection("students");
      if (classId) {
        q = q.where("classId", "==", String(classId));
      }
      const snap = await q.get();
      students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Admin student query failed, falling back to full collection filtering:", error?.message || error);
      const snap = await db.collection("students").get();
      students = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((student) => !classId || String(student.classId) === String(classId));
    }
    // Sort by studentId (admission number)
    students.sort((a, b) => String(a.studentId || "").localeCompare(String(b.studentId || ""), undefined, { numeric: true }));
    return res.json({ students });
  })
);

adminRouter.post(
  "/classes",
  asyncHandler(async (req, res) => {
    const { name, level, track, assessmentType, formTeacherUsername } = req.body || {};
    if (!name || !level) return res.status(400).json({ error: "Missing fields" });

    const derivedAssessmentType =
      assessmentType || (String(level).toLowerCase().includes("nursery") ? "TRAIT" : "NUMERIC");

    const created = await createClass({
      name: String(name),
      level: String(level),
      track: track ? String(track) : null,
      assessmentType: String(derivedAssessmentType),
      formTeacherUsername: formTeacherUsername || null,
      subjectIds: []
    });

    return res.status(201).json(created);
  })
);

adminRouter.get(
  "/classes",
  asyncHandler(async (req, res) => {
    // ADMIN: Returns ALL classes regardless of teacher assignment
    // Also include student counts so the admin UI can show accurate numbers
    const classes = await listClasses();
    const db = getDb();
    const studentsSnap = await db.collection("students").get();
    const students = studentsSnap.docs.map(d => d.data());
    const countMap = {};
    for (const s of students) {
      const cid = s.classId || "";
      countMap[cid] = (countMap[cid] || 0) + 1;
    }
    const enriched = classes.map(c => ({ ...c, studentCount: countMap[c.id] || 0 }));
    return res.json({ classes: enriched });
  })
);

adminRouter.get(
  "/classes/:classId",
  asyncHandler(async (req, res) => {
    // ADMIN: Get full class details including students - accessible regardless of form teacher assignment
    const { classId } = req.params;
    const [cls, students] = await Promise.all([
      getClassById(classId),
      listStudentsByClass(classId)
    ]);
    
    if (!cls) return res.status(404).json({ error: "Class not found" });
    
    return res.json({
      class: cls,
      students: students || []
    });
  })
);

adminRouter.get(
  "/classes/:classId/students",
  asyncHandler(async (req, res) => {
    // ADMIN: Get students in any class - no teacher assignment required
    const { classId } = req.params;
    const students = await listStudentsByClass(classId);
    return res.json({ students });
  })
);

adminRouter.put(
  "/classes/:classId/subjects",
  asyncHandler(async (req, res) => {
    // ADMIN: Configure subjects for any class - no teacher assignment required
    const { classId } = req.params;
    const { subjectIds, formTeacherUsername } = req.body || {};
    const updated = await updateClass(classId, { 
      ...(Array.isArray(subjectIds) ? { subjectIds } : {}),
      formTeacherUsername: formTeacherUsername || null
    });
    return res.json(updated);
  })
);

adminRouter.put(
  "/classes/:classId",
  asyncHandler(async (req, res) => {
    // ADMIN: Update any class properties - no teacher assignment required
    const { classId } = req.params;
    const { name, level, track, assessmentType, formTeacherUsername } = req.body || {};
    const updated = await updateClass(classId, {
      ...(name ? { name: String(name) } : {}),
      ...(level ? { level: String(level) } : {}),
      ...(track !== undefined ? { track: track ? String(track) : null } : {}),
      ...(assessmentType ? { assessmentType: String(assessmentType) } : {}),
      ...(formTeacherUsername !== undefined ? { formTeacherUsername: formTeacherUsername || null } : {})
    });
    return res.json(updated);
  })
);

adminRouter.get(
  "/subjects",
  asyncHandler(async (req, res) => {
    const subjects = await listSubjects();
    return res.json({ subjects });
  })
);

adminRouter.post(
  "/subjects",
  asyncHandler(async (req, res) => {
    const { name, level, track } = req.body || {};
    if (!name || !level) return res.status(400).json({ error: "Missing name or level" });
    const created = await createSubject({ 
      name: String(name),
      level: String(level), // 'Primary', 'JSS', 'SSS'
      track: track ? String(track) : null // 'General', 'Science', 'Art', 'Commercial' for SSS
    });
    return res.status(201).json(created);
  })
);

adminRouter.post(
  "/assignments",
  asyncHandler(async (req, res) => {
    let { teacherUsername, classId, subjectId } = req.body || {};
    // Validation: Require teacher and AT LEAST one of (subjectId/subjectIds)
    // classId/classIds are now optional as the system auto-expands subjects to all matching classes
    if (!teacherUsername || (!subjectId && !req.body.subjectIds)) {
      return res.status(400).json({ error: "Missing teacherUsername or subject selection" });
    }

    const classIds = Array.isArray(req.body.classIds) ? req.body.classIds : [classId];
    const subjectIds = Array.isArray(req.body.subjectIds) ? req.body.subjectIds : [subjectId];

    // Clear old assignments if updating in bulk for a teacher
    if (teacherUsername && (req.body.classIds || req.body.subjectIds)) {
      await deleteAssignmentsByTeacher(teacherUsername);
    }

    const assignmentPromises = [];
    
    // Pre-fetch subject info to determine levels
    const subjectDocs = await Promise.all(subjectIds.filter(id => !!id).map(id => getSubjectById(id)));
    const subjectMap = Object.fromEntries(subjectDocs.filter(s => !!s).map(s => [s.id, s]));

    // Determine all required levels from the subjects
    const requiredLevels = new Set();
    for (const sId of subjectIds) {
      if (subjectMap[sId]?.level) {
        requiredLevels.add(subjectMap[sId].level);
      }
    }

    // Fetch ALL classes and filter to those matching the required levels
    const allClasses = await listClasses();
    const targetClasses = allClasses.filter(cls => requiredLevels.has(cls.level));

    // Create assignments for ALL classes at the subject's level
    for (const cls of targetClasses) {
      for (const sId of subjectIds) {
        if (subjectMap[sId]?.level === cls.level) {
          assignmentPromises.push(
            createAssignment({
              teacherUsername: String(teacherUsername),
              classId: String(cls.id),
              subjectId: String(sId)
            })
          );
        }
      }
    }

    const assignments = await Promise.all(assignmentPromises);
    return res.status(201).json({ 
      count: assignments.length, 
      assignments,
      message: assignments.length > 0 
        ? `✅ Created ${assignments.length} assignments across all classes at the required levels`
        : "⚠️ No assignments created. Check subject/class levels."
    });
  })
);

adminRouter.get(
  "/grading-scale",
  asyncHandler(async (req, res) => {
    const scale = await getGradingScale();
    return res.json(scale || {});
  })
);

adminRouter.post(
  "/grading-scale",
  asyncHandler(async (req, res) => {
    const { grades } = req.body || {};
    if (!Array.isArray(grades) || grades.length === 0) return res.status(400).json({ error: "Missing grades" });
    const scale = await setGradingScale({ grades });
    return res.json(scale);
  })
);

adminRouter.post(
  "/publish-results",
  asyncHandler(async (req, res) => {
    const { classId, session, term } = req.body || {};
    if (!classId || !session || !term) return res.status(400).json({ error: "Missing fields" });
    const published = await publishResults({
      classId: String(classId),
      session: String(session),
      term: String(term),
      publishedBy: req.user.username
    });

    // Notify parents in the background
    const students = await listStudentsByClass(classId);
    const notificationPromises = students
      .filter((s) => s.parentEmail)
      .map((s) => {
        return sendEmail({
          to: s.parentEmail,
          subject: `Results Published: ${term} Term ${session}`,
          html: `
            <h1>Results are Out!</h1>
            <p>Dear ${s.parentName},</p>
            <p>The results for <strong>${s.firstName} ${s.lastName}</strong> for the <strong>${term} Term (${session})</strong> have been published.</p>
            <p>You can now log in to the parent portal to view the report card: <a href="${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/login">${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/login</a></p>
          `
        }).catch((err) => console.error(`Failed to notify parent of ${s.studentId}:`, err));
      });
    
    // We await these so we know if they were sent before finishing the request.
    // For large classes, we might want to make this fully background, but for now this is safer.
    await Promise.all(notificationPromises);

    return res.json(published);
  })
);

adminRouter.post(
  "/term-meta",
  asyncHandler(async (req, res) => {
    const { session, term, resumptionDate } = req.body || {};
    if (!session || !term || !resumptionDate) return res.status(400).json({ error: "Missing fields" });
    const meta = await setTermMeta({ session: String(session), term: String(term), resumptionDate: String(resumptionDate) });
    return res.json(meta);
  })
);

adminRouter.post(
  "/remarks/principal",
  asyncHandler(async (req, res) => {
    // ADMIN: Set principal remarks for any student, regardless of form teacher assignment
    const { session, term, studentId, principalRemark } = req.body || {};
    if (!session || !term || !studentId) return res.status(400).json({ error: "Missing fields" });
    await setPrincipalRemark({
      session: String(session),
      term: String(term),
      studentId: String(studentId),
      principalRemark: principalRemark ? String(principalRemark) : "",
      setBy: req.user.username
    });
    return res.json({ ok: true });
  })
);

adminRouter.post(
  "/remarks/teacher",
  asyncHandler(async (req, res) => {
    // ADMIN: Set teacher/form teacher remarks for any student, regardless of form teacher assignment
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

adminRouter.get(
  "/school-settings",
  asyncHandler(async (req, res) => {
    const settings = await getSchoolSettings();
    return res.json(settings);
  })
);

adminRouter.get(
  "/activity-logs",
  asyncHandler(async (req, res) => {
    const { teacher, limit = 25 } = req.query;
    const db = getDb();
    let query = db.collection("activityLogs").orderBy("createdAt", "desc");
    if (teacher) {
      query = db.collection("activityLogs").where("actor", "==", String(teacher)).orderBy("createdAt", "desc");
    }
    const snap = await query.limit(Math.min(Number(limit), 100)).get();
    const logs = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        actor: data.actor,
        role: data.role,
        action: data.action,
        details: data.details || {},
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : null
      };
    });
    return res.json({ logs });
  })
);

adminRouter.post(
  "/school-settings",
  asyncHandler(async (req, res) => {
    const settings = await setSchoolSettings(req.body);
    return res.json(settings);
  })
);

adminRouter.post(
  "/results/release",
  asyncHandler(async (req, res) => {
    // ADMIN: Release results for any student, regardless of form teacher assignment
    const { session, term, studentId, released } = req.body || {};
    if (!session || !term || !studentId) return res.status(400).json({ error: "Missing fields" });
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
          const student = await getStudentById(studentId);
          if (student && student.parentUsername) {
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

