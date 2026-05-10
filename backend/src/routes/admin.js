import express from "express";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { generateTeacherUsername, generateStudentId, generateParentUsername } from "../ids.js";
import { generateRandomPassword, hashPassword } from "../security.js";
import { createUser } from "../repos/users.js";
import { createStudent, listStudentsByClass } from "../repos/students.js";
import { createClass, listClasses, updateClass } from "../repos/classes.js";
import { createSubject, listSubjects } from "../repos/subjects.js";
import { createAssignment } from "../repos/assignments.js";
import { getGradingScale, setGradingScale, setTermMeta, getSchoolSettings, setSchoolSettings } from "../repos/config.js";
import { setReleaseStatus } from "../repos/releases.js";
import { publishResults, getPublish } from "../repos/publishes.js";
import { setPrincipalRemark } from "../repos/remarks.js";
import { getDb } from "../firebase.js";
import { sendEmail } from "../services/email.js";

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
    const password = generateRandomPassword(8);
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
        await sendEmail({
          to: email,
          subject: "Your FVS Teacher Portal Credentials",
          html: `
            <h1>Welcome to Folusho Victory Schools</h1>
            <p>Dear ${displayName},</p>
            <p>Your staff portal account has been created successfully.</p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Please log in at <a href="${process.env.FRONTEND_ORIGIN}/login">${process.env.FRONTEND_ORIGIN}/login</a></p>
          `
        });
      } catch (err) {
        console.error("Failed to send teacher email:", err);
      }
    }

    return res.status(201).json({ username, password });
  })
);

adminRouter.get(
  "/teachers",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const snap = await db.collection("users").where("role", "==", Roles.TEACHER).orderBy("username").get();
    const teachers = snap.docs.map((d) => {
      const u = d.data();
      return { username: u.username, displayName: u.displayName || "" };
    });
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
    const parentPassword = generateRandomPassword(8);
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
        await sendEmail({
          to: parentEmail,
          subject: "Your FVS Parent Portal Credentials",
          html: `
            <h1>Welcome to Folusho Victory Schools</h1>
            <p>Dear ${parentName},</p>
            <p>An account has been created for you to track the progress of <strong>${firstName} ${lastName}</strong>.</p>
            <p><strong>Parent Username:</strong> ${parentUsername}</p>
            <p><strong>One-time Password:</strong> ${parentPassword}</p>
            <p><strong>Student ID:</strong> ${studentId}</p>
            <p>Please log in at <a href="${process.env.FRONTEND_ORIGIN}/login">${process.env.FRONTEND_ORIGIN}/login</a></p>
          `
        });
      } catch (err) {
        console.error("Failed to send parent email:", err);
      }
    }

    return res.status(201).json({ studentId, parentUsername, parentPassword });
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
    const { teacherUsername, classId, subjectId } = req.body || {};
    if (!teacherUsername || !classId || !subjectId) return res.status(400).json({ error: "Missing fields" });
    const created = await createAssignment({
      teacherUsername: String(teacherUsername),
      classId: String(classId),
      subjectId: String(subjectId)
    });
    return res.status(201).json(created);
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
    return res.json(result);
  })
);

