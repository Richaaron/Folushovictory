import express from "express";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { generateTeacherUsername, generateStudentId, generateParentUsername } from "../ids.js";
import { generateRandomPassword, hashPassword } from "../security.js";
import { createUser, deleteUser, getUserByUsername, updateUser } from "../repos/users.js";
import { createStudent, listStudentsByClass, updateStudent, deleteStudent, getStudentById } from "../repos/students.js";
import { createClass, listClasses, updateClass } from "../repos/classes.js";
import { createSubject, listSubjects } from "../repos/subjects.js";
import { createAssignment } from "../repos/assignments.js";
import { getGradingScale, setGradingScale, setTermMeta, getSchoolSettings, setSchoolSettings } from "../repos/config.js";
import { setReleaseStatus } from "../repos/releases.js";
import { publishResults, getPublish } from "../repos/publishes.js";
import { setPrincipalRemark } from "../repos/remarks.js";
import { getDb } from "../firebase.js";
import { sendEmail, sendResultReleasedEmail } from "../services/email.js";

export const adminRouter = express.Router();

adminRouter.use(authRequired, requireRole(Roles.ADMIN));

adminRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const { session, term } = req.query;
    const db = getDb();
    const [studentsSnap, teachersSnap, classes] = await Promise.all([
      db.collection("students").get(),
      db.collection("users").where("role", "==", Roles.TEACHER).get(),
      listClasses()
    ]);

    let resultStatus = [];
    if (session && term) {
      const statuses = await Promise.all(
        classes.map(async (c) => {
          const pub = await getPublish({ classId: c.id, session: String(session), term: String(term) });
          return { classId: c.id, className: c.name, published: Boolean(pub) };
        })
      );
      resultStatus = statuses;
    }

    return res.json({
      counts: {
        students: studentsSnap.size,
        teachers: teachersSnap.size,
        classes: classes.length
      },
      resultStatus
    });
  })
);

adminRouter.post(
  "/teachers",
  asyncHandler(async (req, res) => {
    const { displayName, email } = req.body || {};
    if (!displayName) return res.status(400).json({ error: "Missing displayName" });

    const username = await generateTeacherUsername();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const passwordHash = await hashPassword(password);

    await createUser({
      username,
      email: email ? String(email) : null,
      portal: "TEACHER",
      role: Roles.TEACHER,
      displayName: String(displayName),
      passwordHash
    });

    if (email) {
      try {
        const portalUrl = process.env.FRONTEND_URL || "https://folushovictoryschool.onrender.com";
        await sendEmail({
          to: email,
          subject: "Your FVS Teacher Portal Credentials",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #5D3FD3; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
              </div>
              <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                <h2 style="margin-top: 0; color: #5D3FD3;">Welcome, ${displayName}!</h2>
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
          `
        });
      } catch (err) {
        console.error("Failed to send teacher email:", err);
      }
    }

    return res.status(201).json({ username, password });
  })
);

adminRouter.put(
  "/teachers/:username",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { displayName, email } = req.body || {};
    const updated = await updateUser(username, { 
      ...(displayName ? { displayName: String(displayName) } : {}),
      ...(email ? { email: String(email) } : {})
    });
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
    const teachers = snap.docs.map((d) => {
      const u = d.data();
      return { username: u.username, displayName: u.displayName || "" };
    });
    // Sort in memory to avoid index requirements
    teachers.sort((a, b) => a.username.localeCompare(b.username));
    return res.json({ teachers });
  })
);

adminRouter.post(
  "/students",
  asyncHandler(async (req, res) => {
    const { firstName, lastName, classId, gender, parentName, parentEmail } = req.body || {};
    if (!firstName || !lastName || !classId || !parentName) return res.status(400).json({ error: "Missing fields" });

    const studentId = await generateStudentId();
    const parentUsername = await generateParentUsername();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let parentPassword = "";
    for (let i = 0; i < 8; i++) {
      parentPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const parentPasswordHash = await hashPassword(parentPassword);

    await createStudent({
      studentId,
      firstName: String(firstName),
      lastName: String(lastName),
      gender: gender ? String(gender) : "",
      classId: String(classId),
      parentName: String(parentName),
      parentEmail: parentEmail ? String(parentEmail) : null,
      createdBy: req.user.username
    });

    await createUser({
      username: parentUsername,
      email: parentEmail ? String(parentEmail) : null,
      portal: "PARENT",
      role: Roles.PARENT,
      displayName: String(parentName),
      passwordHash: parentPasswordHash,
      studentId
    });

    if (parentEmail) {
      try {
        const parentEmailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #5D3FD3; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
              </div>
              <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                <h2 style="margin-top: 0; color: #5D3FD3;">Hello ${parentName},</h2>
                <p>An official parent portal account has been created for you to monitor the academic progress of <strong>${firstName} ${lastName}</strong>.</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">Parent Login Access</p>
                  <p style="margin: 10px 0 0; font-size: 16px;"><strong>Username:</strong> <span style="color: #0B6E4F;">${parentUsername}</span></p>
                  <p style="margin: 5px 0 0; font-size: 16px;"><strong>Password:</strong> <span style="color: #0B6E4F;">${parentPassword}</span></p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/login/parent" 
                     style="background-color: #D4AF37; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                     Login to Parent Portal
                  </a>
                </div>

                <p style="font-size: 14px; color: #64748b;">Through this portal, you can view results, track attendance, and stay updated with school announcements.</p>
                
                <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 16px;">
                  Folusho Victory Schools: Excellence, Integrity, and Academic Leadership.
                </p>
              </div>
            </div>
          `;
        const portalUrl = process.env.FRONTEND_URL || "https://folushovictoryschool.onrender.com";
        await sendEmail({
          to: parentEmail,
          subject: "FVS Parent Portal: Access Your Child's Records",
          html: parentEmailHtml
        });

        // Also send a copy to the school email
        await sendEmail({
          to: "folushovictoryschool@gmail.com",
          subject: `ADMIN COPY: Parent Access Created - ${parentName}`,
          html: `
            <h3>Admin Copy: Parent Account Created</h3>
            <p><strong>Parent Name:</strong> ${parentName}</p>
            <p><strong>Student:</strong> ${firstName} ${lastName}</p>
            <p><strong>Username:</strong> ${parentUsername}</p>
            <p><strong>Password:</strong> ${parentPassword}</p>
            <hr/>
            ${parentEmailHtml}
          `
        });
      } catch (err) {
        console.error("Failed to send parent email:", err);
      }
    }

    return res.status(201).json({ studentId, parentUsername, parentPassword });
  })
);

adminRouter.put(
  "/students/:studentId",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { firstName, lastName, classId, gender, parentName, parentEmail } = req.body || {};
    const updated = await updateStudent(studentId, {
      ...(firstName ? { firstName: String(firstName) } : {}),
      ...(lastName ? { lastName: String(lastName) } : {}),
      ...(classId ? { classId: String(classId) } : {}),
      ...(gender ? { gender: String(gender) } : {}),
      ...(parentName ? { parentName: String(parentName) } : {}),
      ...(parentEmail ? { parentEmail: String(parentEmail) } : {})
    });
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

adminRouter.get(
  "/students",
  asyncHandler(async (req, res) => {
    const { classId } = req.query;
    const db = getDb();
    let q = db.collection("students");
    if (classId) q = q.where("classId", "==", String(classId));
    const snap = await q.orderBy("lastName").get();
    const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    const classes = await listClasses();
    return res.json({ classes });
  })
);

adminRouter.put(
  "/classes/:classId/subjects",
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { subjectIds, formTeacherUsername } = req.body || {};
    const updated = await updateClass(classId, { 
      ...(Array.isArray(subjectIds) ? { subjectIds } : {}),
      formTeacherUsername: formTeacherUsername || null
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
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "Missing name" });
    const created = await createSubject({ name: String(name) });
    return res.status(201).json(created);
  })
);

adminRouter.post(
  "/assignments",
  asyncHandler(async (req, res) => {
    let { teacherUsername, classId, subjectId } = req.body || {};
    if (!teacherUsername || (!classId && !req.body.classIds) || (!subjectId && !req.body.subjectIds)) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const classIds = Array.isArray(req.body.classIds) ? req.body.classIds : [classId];
    const subjectIds = Array.isArray(req.body.subjectIds) ? req.body.subjectIds : [subjectId];

    const results = [];
    for (const cid of classIds) {
      if (!cid) continue;
      for (const sid of subjectIds) {
        if (!sid) continue;
        const created = await createAssignment({
          teacherUsername: String(teacherUsername),
          classId: String(cid),
          subjectId: String(sid)
        });
        results.push(created);
      }
    }

    return res.status(201).json({ count: results.length, assignments: results });
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
            <p>You can now log in to the parent portal to view the report card: <a href="${process.env.FRONTEND_ORIGIN}/login">${process.env.FRONTEND_ORIGIN}/login</a></p>
          `
        }).catch((err) => console.error(`Failed to notify parent of ${s.studentId}:`, err));
      });
    
    // We don't necessarily need to await all of these to return the response, 
    // but doing so ensures we know if they were sent. For a small class, it's fine.
    Promise.all(notificationPromises);

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

adminRouter.get(
  "/school-settings",
  asyncHandler(async (req, res) => {
    const settings = await getSchoolSettings();
    return res.json(settings);
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

