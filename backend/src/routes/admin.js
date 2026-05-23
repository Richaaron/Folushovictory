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
// Firebase dependency removed - all database operations use SafeDatabase (Supabase)
import { sendEmail, sendResultReleasedEmail } from "../services/email.js";
import { logActivity } from "../services/activityLog.js";
import { performHealthCheck, validateDataIntegrity, getCollectionMetrics, SafeDatabase } from "../firestore-utils/index.js";

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
    const [studentsCount, teachersCount, classes, schoolSettings] = await Promise.all([
      SafeDatabase.count("students", []),
      SafeDatabase.count("users", [["role", "==", Roles.TEACHER]]),
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
    const newThisTerm = await SafeDatabase.count("students", [["createdAt", ">=", thirtyDaysAgo.toISOString()]]);

    // Calculate "Awaiting Results"
    // Fetch all publishes for current term
    const { data: pubDocs } = await SafeDatabase.query(
      "publishes",
      [
        ["session", "==", String(currentSession)],
        ["term", "==", String(currentTerm)]
      ],
      { pageSize: 1000 }
    );
    const publishedClassIds = new Set(pubDocs.map(d => d.classId));
    
    // Sum students of classes that are not published
    let awaitingResults = 0;
    await Promise.all(
      classes.map(async (c) => {
        if (!publishedClassIds.has(c.id)) {
          const count = await SafeDatabase.count("students", [["classId", "==", c.id]]);
          awaitingResults += count;
        }
      })
    );

    let resultStatus = [];
    if (session && term) {
      resultStatus = classes.map((c) => ({
        classId: c.id,
        className: c.name,
        published: publishedClassIds.has(c.id)
      }));
    }

    return res.json({
      counts: {
        students: studentsCount,
        teachers: teachersCount,
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
      passwordHash,
      formClassId: payload.formClassId || null
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
    const normalizedUsername = String(username).toLowerCase().trim();
    
    // Log incoming payload to aid debugging for update failures
    const payload = req.body || {};
    console.log(`[Admin] PUT /teachers/${username} payload:`, JSON.stringify(payload));
    console.log(`[Admin] Updating teacher ${username}. formClassId: ${formClassId}`);
    
    try {
      // 1. Update User Record (only metadata fields existing on users)
      console.log(`[Admin] Step 1: Updating user record for ${username}`);
      const updated = await updateUser(username, { 
        ...(displayName ? { displayName: String(displayName) } : {}),
        ...(email ? { email: String(email) } : {})
      });
      console.log(`[Admin] Step 1: updateUser returned for ${username}:`, updated ? 'ok' : 'null');

      // 2. Handle Form Teacher Revocation/Assignment
      if (formClassId !== undefined) {
        console.log(`[Admin] Step 2: Handling form class assignment for ${username} to class ${formClassId}`);
        await revokeFormTeacherStatus(username);
        if (formClassId) {
          await updateClass(formClassId, { formTeacherUsername: normalizedUsername });
        }
      }

      // 3. Handle Atomic Assignment Replacement
      const { classIds, subjectIds } = req.body || {};
      if (Array.isArray(classIds) && Array.isArray(subjectIds)) {
        console.log(`[Admin] Step 3: Replacing assignments for ${username}. Classes: ${classIds}, Subjects: ${subjectIds.length}`);
        await deleteAssignmentsByTeacher(username);
        const assignmentPromises = [];
        
        // Fetch all subjects to determine their levels
        const subjectDocs = await Promise.all(subjectIds.filter(id => !!id).map(id => getSubjectById(id)));
        const subjectMap = Object.fromEntries(subjectDocs.filter(s => !!s).map(s => [s.id, s]));
        
        // Fetch ALL classes to match levels
        const allClasses = await listClasses();

        const normalizeLevel = (value) => {
          const normalized = String(value || '').trim().toUpperCase();
          if (['PRY', 'NUR', 'PRIMARY'].includes(normalized) || normalized.startsWith('PRE')) return 'Primary';
          if (normalized.startsWith('JSS') || normalized.includes('JUNIOR SECONDARY') || normalized.startsWith('JR')) return 'JSS';
          if (normalized.startsWith('SSS') || normalized.includes('SENIOR SECONDARY') || normalized.startsWith('SR')) return 'SSS';
          return normalized;
        };

        // Logic:
        // - For each subject selected:
        //   - If it's a Primary subject: assign it to all Primary-level classes when no classIds are provided
        //   - If it's a Secondary subject: assign it to all matching classes at that level (JSS/SSS)
        for (const sId of subjectIds) {
          const subject = subjectMap[sId];
          if (!subject) continue;

          const subjectLevel = normalizeLevel(subject.level);
          const isPrimarySubject = subjectLevel === 'Primary';
          
          const targetClasses = allClasses.filter(cls => {
            const levelMatch = normalizeLevel(cls.level) === subjectLevel;
            if (!levelMatch) return false;

            if (isPrimarySubject) {
              return classIds.length === 0 || classIds.includes(cls.id);
            }
            
            // If it's Secondary, assign to all classes at that level (or filter by classIds if provided)
            return classIds.length > 0 ? classIds.includes(cls.id) : true;
          });

          for (const cls of targetClasses) {
            assignmentPromises.push(createAssignment({
              teacherUsername: normalizedUsername,
              classId: cls.id,
              subjectId: sId,
              createdAt: new Date().toISOString()
            }));
          }
        }
        
        if (assignmentPromises.length > 0) {
          console.log(`[Admin] Creating ${assignmentPromises.length} new assignments for ${username}`);
          await Promise.all(assignmentPromises);
        }
      }

      console.log(`[Admin] Successfully updated teacher profile for ${username}`);
      return res.json(updated);
    } catch (error) {
      // Log full error (including stack) for troubleshooting
      console.error(`[Admin] Update failed for teacher ${username}:`, error);
      // Prefer to return a clear message to the caller while avoiding sensitive stack output
      const message = error && error.message ? error.message : "An error occurred. Please try again.";
      return res.status(error.statusCode || 500).json({ 
        error: message
      });
    }
  })
);

adminRouter.delete(
  "/teachers/:username",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    console.log(`[Admin] Attempting to delete teacher: ${username}`);
    
    try {
      // 1. Revoke form teacher status from any classes
      console.log(`[Admin] Revoking form teacher status for: ${username}`);
      await revokeFormTeacherStatus(username);
      
      // 2. Delete all assignments for this teacher
      console.log(`[Admin] Deleting assignments for: ${username}`);
      await deleteAssignmentsByTeacher(username);
      
      // 3. Delete the user record
      console.log(`[Admin] Deleting user record for: ${username}`);
      const result = await deleteUser(username);
      
      console.log(`[Admin] Successfully processed deletion for: ${username}`);
      return res.json({ 
        success: true, 
        message: result.message || `✅ Staff account ${username} and associated data deleted.` 
      });
    } catch (error) {
      console.error(`[Admin] Deletion failed for ${username}:`, error.message);
      return res.status(error.statusCode || 500).json({ 
        error: error.message || "Internal server error during deletion" 
      });
    }
  })
);

adminRouter.get(
  "/teachers",
  asyncHandler(async (req, res) => {
    const { data: teachersSnap } = await SafeDatabase.query("users", [["role", "==", Roles.TEACHER]], { pageSize: 1000 });
    
    const teachers = await Promise.all(teachersSnap.map(async (u) => {
      const username = u.username;
      
      // Fetch assignments
      const { data: assignDocs } = await SafeDatabase.query("assignments", [["teacherUsername", "==", username]], { pageSize: 1000 });
      const assignedSubjectIds = [...new Set(assignDocs.map(doc => doc.subjectId))];
      const selectedClassIds = [...new Set(assignDocs.map(doc => doc.classId))];
      
      // Fetch form class
      const { data: classDocs } = await SafeDatabase.query("classes", [["formTeacherUsername", "==", username]], { pageSize: 1000 });
      const formClassId = classDocs[0]?.id || "";
      
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

    return res.status(201).json({ studentId, parentUsername, parentPassword });
  })
);

adminRouter.put(
  "/students/:studentId",
  asyncHandler(async (req, res) => {
    const studentId = String(req.params.studentId || "").toLowerCase().trim();
    const patch = validateStudentUpdatePayload(req.body || {});
    const updated = await updateStudent(studentId, patch);
    return res.json(updated);
  })
);

adminRouter.delete(
  "/students/:studentId",
  asyncHandler(async (req, res) => {
    const studentId = String(req.params.studentId || "").toLowerCase().trim();
    // Find parent user to delete as well
    const { data: parents } = await SafeDatabase.query(
      "users",
      [
        ["role", "==", Roles.PARENT],
        ["studentId", "==", studentId]
      ],
      { pageSize: 10 }
    );
    
    for (const parent of parents) {
      await deleteUser(parent.username);
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
    const constraints = classId ? [["classId", "==", String(classId)]] : [];
    const { data: students } = await SafeDatabase.query("students", constraints, { pageSize: 1000 });
    
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
    const enriched = await Promise.all(
      classes.map(async (c) => {
        const studentCount = await SafeDatabase.count("students", [["classId", "==", c.id]]);
        return { ...c, studentCount };
      })
    );
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
    const normalizedTeacherUsername = teacherUsername ? String(teacherUsername).toLowerCase().trim() : null;
    
    // Validation: Require teacher and AT LEAST one of (subjectId/subjectIds)
    // classId/classIds are now optional as the system auto-expands subjects to all matching classes
    if (!normalizedTeacherUsername || (!subjectId && !req.body.subjectIds)) {
      return res.status(400).json({ error: "Missing teacherUsername or subject selection" });
    }

    const classIds = Array.isArray(req.body.classIds) ? req.body.classIds : (classId ? [classId] : []);
    const subjectIds = Array.isArray(req.body.subjectIds) ? req.body.subjectIds : [subjectId];

    // Clear old assignments if updating in bulk for a teacher
    if (normalizedTeacherUsername && (req.body.classIds || req.body.subjectIds)) {
      await deleteAssignmentsByTeacher(normalizedTeacherUsername);
    }

    const assignmentPromises = [];
    
    const normalizeLevel = (value) => {
      const normalized = String(value || '').trim().toUpperCase();
      if (['PRY', 'NUR', 'PRIMARY'].includes(normalized) || normalized.startsWith('PRE')) return 'Primary';
      if (normalized.startsWith('JSS') || normalized.includes('JUNIOR SECONDARY') || normalized.startsWith('JR')) return 'JSS';
      if (normalized.startsWith('SSS') || normalized.includes('SENIOR SECONDARY') || normalized.startsWith('SR')) return 'SSS';
      return normalized;
    };

    // Pre-fetch subject info to determine levels
    const subjectDocs = await Promise.all(subjectIds.filter(id => !!id).map(id => getSubjectById(id)));
    const subjectMap = Object.fromEntries(subjectDocs.filter(s => !!s).map(s => [s.id, s]));

    // Determine all required levels from the subjects
    const requiredLevels = new Set();
    for (const sId of subjectIds) {
      if (subjectMap[sId]?.level) {
        requiredLevels.add(normalizeLevel(subjectMap[sId].level));
      }
    }

    // Logic:
    // - For each subject selected:
    //   - If it's a Primary subject: ONLY assign it to classes in 'classIds' that are 'Primary'
    //   - If it's a Secondary subject: assign it to ALL matching classes at that level (JSS/SSS)
    for (const sId of subjectIds) {
      const subject = subjectMap[sId];
      if (!subject) continue;

      const subjectLevel = normalizeLevel(subject.level);
      const isPrimarySubject = subjectLevel === 'Primary';
      
      const targetClasses = allClasses.filter(cls => {
        const levelMatch = normalizeLevel(cls.level) === subjectLevel;
        if (!levelMatch) return false;

        // If it's Primary, it MUST be in the specifically selected classIds
        if (isPrimarySubject) {
          return classIds.includes(cls.id);
        }
        
        // If it's Secondary, assign to all classes at that level (or filter by classIds if provided)
        return classIds.length > 0 ? classIds.includes(cls.id) : true;
      });

      for (const cls of targetClasses) {
        assignmentPromises.push(
          createAssignment({
            teacherUsername: normalizedTeacherUsername,
            classId: String(cls.id),
            subjectId: String(sId)
          })
        );
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
    const constraints = teacher ? [["actor", "==", String(teacher)]] : [];
    const { data: logs } = await SafeDatabase.query(
      "activityLogs",
      constraints,
      { 
        pageSize: Math.min(Number(limit), 100), 
        orderBy: "createdAt", 
        orderDirection: "desc" 
      }
    );
    return res.json({ logs });
  })
);

adminRouter.delete(
  "/activity-logs/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await SafeDatabase.deleteWithValidation("activityLogs", id);
    return res.json({ success: true, message: "Activity log deleted successfully." });
  })
);

adminRouter.delete(
  "/activity-logs",
  asyncHandler(async (req, res) => {
    const { getSupabase } = await import("../supabase.js");
    const { error } = await getSupabase()
      .from("activityLogs")
      .delete()
      .neq("id", "");
    if (error) throw error;
    return res.json({ success: true, message: "All activity logs cleared." });
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

