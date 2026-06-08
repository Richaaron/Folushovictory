import express from "express";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { generateTeacherUsername, generateStudentId, generateParentUsername } from "../ids.js";
import { generateRandomPassword, hashPassword } from "../security.js";
import { createUser, deleteUser, getUserByUsername, updateUser } from "../repos/users.js";
import { createStudent, createStudentWithParent, listStudentsByClass, countStudentsByClass, updateStudent, deleteStudent, getStudentById } from "../repos/students.js";
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
import { sendEmail, sendResultReleasedEmail, sendLoginChangeNotificationEmail } from "../services/email.js";
import { logActivity } from "../services/activityLog.js";
import { performHealthCheck, validateDataIntegrity, getCollectionMetrics, SafeDatabase } from "../firestore-utils/index.js";
import { getIdColumnName } from "../firestore-utils/db-utils.js";
import { generateSimpleRegistrationCode } from "../registrationCodeUtils.js";
import { createRegistrationCode, listRegistrationCodes, revokeRegistrationCode, getRegistrationCodeByCode } from "../repos/registrationCodes.js";

export const adminRouter = express.Router();

async function queryAllDocuments(collectionName, constraints = [], options = {}) {
  const idCol = getIdColumnName(collectionName);
  const pageSize = Math.min(options.pageSize || 1000, 1000);
  let allData = [];
  let lastId = null;
  let hasMore = true;

  while (hasMore) {
    const queryConstraints = [...constraints];
    if (lastId !== null) {
      queryConstraints.push([idCol, ">", lastId]);
    }

    const result = await SafeDatabase.query(collectionName, queryConstraints, {
      ...options,
      pageSize
    });

    allData.push(...result.data);
    hasMore = result.hasMore;
    lastId = result.lastDoc?.[idCol] ?? null;

    if (!hasMore || result.data.length === 0) break;
  }

  return allData;
}

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

adminRouter.get(
  "/powerbi/export",
  asyncHandler(async (req, res) => {
    const { session, term } = req.query;
    const schoolSettings = await getSchoolSettings();
    const currentSession = String(session || schoolSettings.currentSession);
    const currentTerm = String(term || schoolSettings.currentTerm);

    const [classes, students, publishes, scores] = await Promise.all([
      listClasses(),
      queryAllDocuments("students", [], { pageSize: 1000 }),
      queryAllDocuments(
        "publishes",
        [
          ["session", "==", currentSession],
          ["term", "==", currentTerm]
        ],
        { pageSize: 1000 }
      ),
      queryAllDocuments(
        "scores",
        [
          ["session", "==", currentSession],
          ["term", "==", currentTerm]
        ],
        { pageSize: 1000 }
      )
    ]);

    const studentsByClass = classes.map((cls) => ({
      classId: cls.id,
      className: cls.name,
      studentCount: students.filter((student) => student.classId === cls.id).length
    }));

    const scoreStatsByClass = classes.map((cls) => {
      const classScores = scores.filter((score) => score.classId === cls.id);
      const totalScore = classScores.reduce((sum, score) => {
        const ca1 = Number(score.ca1 || 0);
        const ca2 = Number(score.ca2 || 0);
        const exam = Number(score.exam || 0);
        return sum + ca1 + ca2 + exam;
      }, 0);
      return {
        classId: cls.id,
        className: cls.name,
        scoreRowCount: classScores.length,
        averageScore: classScores.length > 0 ? Number((totalScore / classScores.length).toFixed(2)) : 0
      };
    });

    return res.json({
      exportType: "PowerBI",
      currentSession,
      currentTerm,
      totals: {
        classes: classes.length,
        students: students.length,
        publishes: publishes.length,
        scores: scores.length
      },
      studentsByClass,
      scoreStatsByClass,
      classes,
      students,
      publishes,
      scores
    });
  })
);

async function acquirePowerBIAccessToken({ tenantId, clientId, clientSecret }) {
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://analysis.windows.net/powerbi/api/.default"
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Power BI auth failed: ${data.error_description || data.error || response.statusText}`);
  }
  if (!data.access_token) {
    throw new Error("Power BI authentication response did not return an access token.");
  }

  return data.access_token;
}

async function generatePowerBIEmbedToken({ accessToken, workspaceId, reportId }) {
  const tokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      accessLevel: "View",
      allowSaveAs: false
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Power BI embed token failed: ${data.error || data.error_description || response.statusText}`);
  }
  if (!data.token) {
    throw new Error("Power BI GenerateToken response did not return a token.");
  }

  return data;
}

adminRouter.get(
  "/powerbi/embed",
  asyncHandler(async (req, res) => {
    const tenantId = process.env.POWERBI_TENANT_ID;
    const clientId = process.env.POWERBI_CLIENT_ID;
    const clientSecret = process.env.POWERBI_CLIENT_SECRET;
    const workspaceId = process.env.POWERBI_WORKSPACE_ID;
    const defaultReportId = process.env.POWERBI_REPORT_ID;
    const reportId = String(req.query.reportId || defaultReportId || "");

    if (!tenantId || !clientId || !clientSecret || !workspaceId || !reportId) {
      return res.status(500).json({
        error: "Power BI embedding is not configured. Please provide POWERBI_TENANT_ID, POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET, POWERBI_WORKSPACE_ID, and POWERBI_REPORT_ID in environment variables."
      });
    }

    const accessToken = await acquirePowerBIAccessToken({ tenantId, clientId, clientSecret });
    const embedTokenPayload = await generatePowerBIEmbedToken({ accessToken, workspaceId, reportId });
    const embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`;

    return res.json({
      reportId,
      workspaceId,
      embedUrl,
      embedToken: embedTokenPayload.token,
      tokenExpiration: embedTokenPayload.expiration,
      datasetId: embedTokenPayload.datasetId || null,
      tokenType: "Embed",
      accessLevel: "View"
    });
  })
);

adminRouter.post(
  "/teachers",
  asyncHandler(async (req, res) => {
    // Admin-created teacher should only generate a registration code (tch-2026-NNN)
    const payload = validateTeacherPayload(req.body || {});

    // Generate a sequential human-friendly registration code
    const code = await generateSimpleRegistrationCode(SafeDatabase.db);

    // Create registration code record with optional email and formClass assignment
    const codeRecord = await createRegistrationCode({
      code,
      displayName: payload.displayName,
      email: payload.email || null,
      subjectIds: [],
      formClassId: payload.formClassId || null,
      expiresAt: null
    });

    // Log activity
    await logActivity({
      actor: req.user.username,
      role: Roles.ADMIN,
      action: "Generated teacher registration code (admin)",
      details: { code, displayName: payload.displayName, email: payload.email || null },
      resourceType: "registrationCode",
      resourceId: code
    }).catch((error) => console.error("Activity log failed:", error));

    return res.status(201).json({
      success: true,
      code: codeRecord.code,
      displayName: codeRecord.displayName,
      email: codeRecord.email || null,
      formClassAssigned: !!codeRecord.formClassId,
      message: `✅ Registration code ${codeRecord.code} generated. No email sent; teacher will self-register.`
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

// ADMIN: Resend a registration invitation to a teacher by username
adminRouter.post(
  "/teachers/:username/resend-registration",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    if (!user) return res.status(404).json({ error: "Teacher not found" });
    if (!user.email) return res.status(400).json({ error: "Teacher has no email address" });

    // Find an active, unused registration code for this teacher (by email)
    const { data: codes } = await SafeDatabase.query(
      "registrationCodes",
      [["email", "==", String(user.email).trim().toLowerCase()], ["used", "==", false], ["status", "==", "ACTIVE"]],
      { pageSize: 10 }
    );

    const codeRecord = codes && codes.length > 0 ? codes[0] : null;
    if (!codeRecord) return res.status(404).json({ error: "No active registration code found for this teacher" });

    const link = `${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/register/teacher?code=${encodeURIComponent(codeRecord.code)}`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #5D3FD3; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
        </div>
        <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #5D3FD3;">Teacher Registration Invitation</h2>
          <p>Hello <strong>${codeRecord.displayName}</strong>,</p>
          <p>You have been invited to join the Folusho Victory Schools teacher portal. Your account has been pre-configured with your subject and class allocations.</p>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #5D3FD3;">
            <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">Your Registration Code</p>
            <p style="margin: 16px 0 0; font-size: 24px; text-align: center; letter-spacing: 2px;"><strong style="color: #0B6E4F; font-family: monospace;">${codeRecord.code}</strong></p>
            <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">Use this code when creating your account</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}" 
               style="background-color: #D4AF37; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
               Create Your Account
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            <strong>How to register:</strong><br />
            1. Click the button above to visit the registration page<br />
            2. Enter your full name, email, and password<br />
            3. Enter the registration code: <strong style="font-family: monospace;">${codeRecord.code}</strong><br />
            4. Your subjects and class allocation will be automatically applied
          </p>

          ${codeRecord.expiresAt ? `<p style="font-size: 12px; color: #f97316; margin-top: 16px;">⏰ <strong>This code expires on:</strong> ${new Date(codeRecord.expiresAt).toLocaleDateString()}</p>` : ""}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">© ${new Date().getFullYear()} Folusho Victory Schools. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({ to: user.email, subject: "Teacher Registration Invitation - FVS Teacher Portal", html: emailHtml });

      await logActivity({
        actor: req.user.username,
        role: Roles.ADMIN,
        action: "Resent teacher registration code",
        details: { code: codeRecord.code, displayName: codeRecord.displayName, sentTo: user.email },
        resourceType: "registrationCode",
        resourceId: codeRecord.code
      }).catch((error) => console.error("Activity log failed:", error));

      return res.json({ success: true, message: `✅ Registration code resent successfully to ${user.email}` });
    } catch (error) {
      console.error("Failed to resend registration email:", error);
      return res.status(500).json({ error: "Failed to send registration email. Please try again.", details: error.message });
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

// ==========================================
// TEACHER REGISTRATION CODES
// ==========================================

adminRouter.post(
  "/registration-codes",
  asyncHandler(async (req, res) => {
    const { displayName, email, subjectIds, formClassId, expiryDays } = req.body || {};
    
    if (!displayName) {
      return res.status(400).json({ error: "Missing displayName" });
    }

    // Generate code using database counter for sequential numbering
    const code = await generateSimpleRegistrationCode(SafeDatabase.db);
    
    // Calculate expiry date
    let expiresAt = null;
    if (expiryDays && expiryDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      expiresAt = expiresAt.toISOString();
    }

    // Create code record with subject and form class allocations
    const codeRecord = await createRegistrationCode({
      code,
      displayName: String(displayName).trim(),
      email: email ? String(email).trim() : null,
      subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
      formClassId: formClassId ? String(formClassId).trim() : null,
      expiresAt
    });

    // Log activity
    await logActivity({
      actor: req.user.username,
      role: Roles.ADMIN,
      action: "Generated teacher registration code",
      details: { 
        code,
        displayName,
        subjectCount: (subjectIds || []).length,
        hasFormClass: !!formClassId,
        expiryDays
      },
      resourceType: "registrationCode",
      resourceId: code
    }).catch((error) => console.error("Activity log failed:", error));

    return res.status(201).json({
      success: true,
      message: "✅ Registration code generated successfully",
      code: {
        code,
        displayName,
        email: email || null,
        subjectsCount: (subjectIds || []).length,
        formClassAssigned: !!formClassId,
        expiresAt,
        createdAt: new Date().toISOString(),
        status: "ACTIVE"
      }
    });
  })
);

adminRouter.get(
  "/registration-codes",
  asyncHandler(async (req, res) => {
    const { status, used } = req.query;
    
    const filters = {};
    if (status) filters.status = String(status).toUpperCase();
    if (used !== undefined) filters.used = used === "true";

    const codes = await listRegistrationCodes(filters);
    
    return res.json({
      total: codes.length,
      codes: codes.map(c => ({
        code: c.code,
        displayName: c.displayName,
        email: c.email,
        subjectsCount: (c.subjectIds || []).length,
        formClassAssigned: !!c.formClassId,
        status: c.status,
        used: c.used,
        usedBy: c.usedBy || null,
        usedAt: c.usedAt || null,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt
      }))
    });
  })
);

adminRouter.get(
  "/registration-codes/:code",
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const codeRecord = await getRegistrationCodeByCode(code);
    
    if (!codeRecord) {
      return res.status(404).json({ error: "Registration code not found" });
    }

    return res.json({
      code: codeRecord.code,
      displayName: codeRecord.displayName,
      email: codeRecord.email,
      subjectIds: codeRecord.subjectIds || [],
      formClassId: codeRecord.formClassId,
      status: codeRecord.status,
      used: codeRecord.used,
      usedBy: codeRecord.usedBy || null,
      usedAt: codeRecord.usedAt || null,
      createdAt: codeRecord.createdAt,
      expiresAt: codeRecord.expiresAt
    });
  })
);

adminRouter.delete(
  "/registration-codes/:code",
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    
    const codeRecord = await getRegistrationCodeByCode(code);
    if (!codeRecord) {
      return res.status(404).json({ error: "Registration code not found" });
    }

    if (codeRecord.used) {
      return res.status(400).json({ error: "Cannot revoke a code that has already been used" });
    }

    await revokeRegistrationCode(code);

    // Log activity
    await logActivity({
      actor: req.user.username,
      role: Roles.ADMIN,
      action: "Revoked teacher registration code",
      details: { code, displayName: codeRecord.displayName },
      resourceType: "registrationCode",
      resourceId: code
    }).catch((error) => console.error("Activity log failed:", error));

    return res.json({ 
      success: true, 
      message: `✅ Registration code ${code} has been revoked` 
    });
  })
);

adminRouter.post(
  "/registration-codes/:code/send",
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { recipientEmail } = req.body || {};

    const codeRecord = await getRegistrationCodeByCode(code);
    if (!codeRecord) {
      return res.status(404).json({ error: "Registration code not found" });
    }

    if (codeRecord.used) {
      return res.status(400).json({ error: "Code has already been used" });
    }

    const targetEmail = recipientEmail || codeRecord.email;
    if (!targetEmail) {
      return res.status(400).json({ error: "No email address found or provided" });
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #5D3FD3; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
        </div>
        <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #5D3FD3;">Teacher Registration Invitation</h2>
          <p>Hello <strong>${codeRecord.displayName}</strong>,</p>
          <p>You have been invited to join the Folusho Victory Schools teacher portal. Your account has been pre-configured with your subject and class allocations.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #5D3FD3;">
            <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">Your Registration Code</p>
            <p style="margin: 16px 0 0; font-size: 24px; text-align: center; letter-spacing: 2px;"><strong style="color: #0B6E4F; font-family: monospace;">${codeRecord.code}</strong></p>
            <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">Use this code when creating your account</p>
          </div>

          <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Subject Allocations:</strong> ${(codeRecord.subjectIds || []).length} subject(s) assigned<br />
              <strong>Form Class:</strong> ${codeRecord.formClassId ? "✓ Form class assigned" : "No form class assigned"}
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/register/teacher?code=${encodeURIComponent(codeRecord.code)}" 
               style="background-color: #D4AF37; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
               Create Your Account
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            <strong>How to register:</strong><br />
            1. Click the button above to visit the registration page<br />
            2. Enter your full name, email, and password<br />
            3. Enter the registration code: <strong style="font-family: monospace;">${codeRecord.code}</strong><br />
            4. Your subjects and class allocation will be automatically applied
          </p>

          ${codeRecord.expiresAt ? `<p style="font-size: 12px; color: #f97316; margin-top: 16px;">⏰ <strong>This code expires on:</strong> ${new Date(codeRecord.expiresAt).toLocaleDateString()}</p>` : ""}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            © ${new Date().getFullYear()} Folusho Victory Schools. All rights reserved.<br />
            If you have any questions, please contact the school administration.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: targetEmail,
        subject: "Teacher Registration Invitation - FVS Teacher Portal",
        html: emailHtml
      });

      // Log activity
      await logActivity({
        actor: req.user.username,
        role: Roles.ADMIN,
        action: "Sent teacher registration code",
        details: { code, displayName: codeRecord.displayName, sentTo: targetEmail },
        resourceType: "registrationCode",
        resourceId: code
      }).catch((error) => console.error("Activity log failed:", error));

      return res.json({
        success: true,
        message: `✅ Registration code sent successfully to ${targetEmail}`
      });
    } catch (error) {
      console.error("Failed to send registration code email:", error);
      return res.status(500).json({
        error: "Failed to send email. Please try again.",
        details: error.message
      });
    }
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

      const c1 = Number(ca1 || 0);
      const c2 = Number(ca2 || 0);
      const e = Number(exam || 0);
      if (c1 > 20 || c2 > 20) return res.status(400).json({ error: "CA score cannot exceed 20" });
      if (e > 60) return res.status(400).json({ error: "Exam score cannot exceed 60" });
      
      await upsertNumericScore({
        session: String(session),
        term: String(term),
        classId: String(classId),
        studentId: String(studentId),
        subjectId: String(subjectId),
        ca1: c1,
        ca2: c2,
        exam: e,
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
        const studentCount = await countStudentsByClass(c.id);
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
    const allClasses = await listClasses();
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
    const student = await getStudentById(String(studentId));
    if (!student) return res.status(404).json({ error: "Student not found" });
    const result = await setReleaseStatus({
      session: String(session),
      term: String(term),
      studentId: String(studentId),
      classId: student.classId,
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

