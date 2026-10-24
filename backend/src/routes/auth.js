import express from "express";
import { asyncHandler } from "../http.js";
import { getUserByUsername, getUserByEmail, createUser } from "../repos/users.js";
import { verifyPassword, signJwt, hashPassword } from "../security.js";
import { Roles } from "../constants.js";
import { logActivity } from "../services/activityLog.js";
import { validateTeacherRegistration } from "../validation.js";
import { sendTeacherWelcomeEmail } from "../services/email.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { getRegistrationCodeByCode, markCodeAsUsed, isCodeValid } from "../repos/registrationCodes.js";
import { getClassById, listClasses, updateClass } from "../repos/classes.js";
import { getSubjectById } from "../repos/subjects.js";
import { createAssignment } from "../repos/assignments.js";
import { isValidCodeFormat } from "../registrationCodeUtils.js";

export const authRouter = express.Router();

authRouter.get(
  "/teacher-registration/:code",
  asyncHandler(async (req, res) => {
    if (!isValidCodeFormat(req.params.code)) {
      return res.status(404).json({ error: "Registration invitation is invalid or expired." });
    }
    const codeRecord = await getRegistrationCodeByCode(req.params.code);
    if (!codeRecord || !(await isCodeValid(codeRecord.code))) {
      return res.status(404).json({ error: "Registration invitation is invalid or expired." });
    }
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email || !codeRecord.email || codeRecord.email.toLowerCase() !== email) {
      return res.status(404).json({ error: "Registration invitation is invalid or does not match this email." });
    }

    const [formClass, subjects] = await Promise.all([
      codeRecord.formClassId ? getClassById(codeRecord.formClassId) : null,
      Promise.all((codeRecord.subjectIds || []).map(id => getSubjectById(id)))
    ]);

    if (codeRecord.formClassId && !formClass) {
      return res.status(500).json({ error: "The class assigned to this invitation could not be found." });
    }

    return res.json({
      code: codeRecord.code,
      displayName: codeRecord.displayName || "",
      email: codeRecord.email,
      formClass: formClass ? { id: formClass.id, name: formClass.name, level: formClass.level } : null,
      subjects: subjects.filter(Boolean).map(subject => ({
        id: subject.id,
        name: subject.name,
        level: subject.level
      }))
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { portal, username, password } = req.body || {};
    if (!portal || !username || !password) return res.status(400).json({ error: "Missing fields" });

    const identifier = String(username).trim();
    let user;

    // Teachers sign in with either their assigned teacher code or email address and password
    if (portal && String(portal).toUpperCase() === "TEACHER") {
      user = await getUserByUsername(identifier);
      if (!user && identifier.includes("@")) {
        user = await getUserByEmail(identifier);
      }
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      // Require initial signup for teachers who don't have a password yet
      if (!user.passwordHash || user.passwordHash === "") {
        return res.status(403).json({
          error: "Teacher accounts must complete initial setup before logging in. Use the registration page.",
          code: "NEED_SIGNUP"
        });
      }
    } else {
      user = await getUserByUsername(identifier);
      if (!user && identifier.includes("@")) {
        user = await getUserByEmail(identifier);
      }
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await verifyPassword(password, user.passwordHash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Enforce portal-role alignment: a teacher cannot log in as admin, and vice versa
    const portalUpper = String(portal).toUpperCase();
    const roleUpper = String(user.role || "").toUpperCase();
    const portalRoleMap = {
      ADMIN: "ADMIN",
      TEACHER: "TEACHER",
      PARENT: "PARENT"
    };
    const expectedRole = portalRoleMap[portalUpper];
    if (expectedRole && roleUpper !== expectedRole) {
      const portalLabel = portalUpper.charAt(0) + portalUpper.slice(1).toLowerCase();
      const actualLabel = roleUpper.charAt(0) + roleUpper.slice(1).toLowerCase();
      return res.status(403).json({
        error: `This account is registered as a ${actualLabel}. Please use the ${actualLabel} portal to log in.`
      });
    }

    const token = signJwt({
      sub: user.username,
      role: user.role,
      portal: user.portal,
      studentId: user.studentId || null
    });

    if (user.role === Roles.TEACHER) {
      void logActivity({
        actor: user.username,
        role: user.role,
        action: "Teacher login",
        details: { portal: String(user.portal) },
        resourceType: "login",
        resourceId: user.username
      }).catch((error) => console.error("Activity log failed:", error));
    }

    return res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        portal: user.portal,
        displayName: user.displayName || ""
      }
    });
  })
);

// ==========================================
// TEACHER SELF-REGISTRATION ENDPOINT
// ==========================================
// Allows teachers to create their own account with email and password
// Uses an email-bound invitation to authorize form-class or subject allocations.
authRouter.post(
  "/register/teacher",
  asyncHandler(async (req, res) => {
    // Validate input
    const payload = validateTeacherRegistration(req.body || {});

    // 1. Validate registration code
    const codeIsValid = await isCodeValid(payload.registrationCode);
    if (!codeIsValid) {
      return res.status(400).json({ 
        error: "Invalid or expired registration code. Please contact administration.",
        code: "INVALID_CODE"
      });
    }

    // 2. Get code details to retrieve allocations
    const codeRecord = await getRegistrationCodeByCode(payload.registrationCode);
    if (!codeRecord) {
      return res.status(400).json({ 
        error: "Registration code not found",
        code: "CODE_NOT_FOUND"
      });
    }
    if (!codeRecord.email) {
      return res.status(400).json({
        error: "This invitation has no email address. Ask the administrator to issue a new invitation.",
        code: "EMAIL_REQUIRED"
      });
    }
    const username = payload.registrationCode.toLowerCase();
    let selectedSubjects = [];

    // 3. Verify email matches the code (if email was pre-assigned)
    if (codeRecord.email.toLowerCase() !== payload.email.toLowerCase()) {
      return res.status(400).json({ 
        error: "Email does not match the registration code",
        code: "EMAIL_MISMATCH"
      });
    }

    if (payload.teacherType === "FORM_TEACHER") {
      if (!codeRecord.formClassId || payload.formClassId !== codeRecord.formClassId || payload.subjectIds.length > 0) {
        return res.status(400).json({
          error: "This invitation does not authorize the selected form-teacher assignment.",
          code: "ALLOCATION_MISMATCH"
        });
      }
      const assignedClass = await getClassById(payload.formClassId);
      if (!assignedClass) {
        return res.status(400).json({
          error: "The form class in this invitation could not be found.",
          code: "ALLOCATION_MISMATCH"
        });
      }
      if (assignedClass.formTeacherUsername && assignedClass.formTeacherUsername !== username) {
        return res.status(409).json({
          error: "The form class in this invitation already has a form teacher. Contact the administrator.",
          code: "CLASS_ALREADY_ASSIGNED"
        });
      }
    } else {
      const allowedSubjectIds = new Set(codeRecord.subjectIds || []);
      selectedSubjects = await Promise.all(payload.subjectIds.map(id => getSubjectById(id)));
      if (
        !payload.subjectIds.length ||
        payload.formClassId ||
        payload.subjectIds.some(id => !allowedSubjectIds.has(id)) ||
        selectedSubjects.some(subject => !subject)
      ) {
        return res.status(400).json({
          error: "Select one or more subjects included in your invitation.",
          code: "ALLOCATION_MISMATCH"
        });
      }
    }

    // 4. Check if email already exists
    const { data: existingUsers } = await SafeDatabase.query(
      "users",
      [["email", "==", payload.email]],
      { pageSize: 1 }
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: "Email already registered",
        code: "EMAIL_EXISTS"
      });
    }

    // The invitation code is also the teacher's login code.
    const passwordHash = await hashPassword(payload.password);

    // 6. Create user record with allocations from code
    await createUser({
      username,
      email: payload.email,
      portal: "TEACHER",
      role: Roles.TEACHER,
      displayName: payload.displayName,
      passwordHash,
      teacherType: payload.teacherType,
      formClassId: payload.teacherType === "FORM_TEACHER" ? payload.formClassId : null,
      subjectIds: payload.teacherType === "SUBJECT_TEACHER" ? payload.subjectIds : [],
      registrationCodeUsed: payload.registrationCode
    }, { docId: username });

    if (payload.teacherType === "FORM_TEACHER") {
      await updateClass(payload.formClassId, { formTeacherUsername: username });
    } else {
      const allClasses = await listClasses();
      const normalizeLevel = (value) => {
        const normalized = String(value || "").trim().toUpperCase();
        if (["PRY", "NUR", "PRIMARY"].includes(normalized) || normalized.startsWith("PRE")) return "Primary";
        if (normalized.startsWith("JSS") || normalized.includes("JUNIOR SECONDARY") || normalized.startsWith("JR")) return "JSS";
        if (normalized.startsWith("SSS") || normalized.includes("SENIOR SECONDARY") || normalized.startsWith("SR")) return "SSS";
        return normalized;
      };
      const assignments = [];

      for (const subject of selectedSubjects) {
        const subjectLevel = normalizeLevel(subject.level);
        const targetClasses = allClasses.filter((classRecord) => {
          if (normalizeLevel(classRecord.level) !== subjectLevel) return false;
          if (subjectLevel === "Primary") return classRecord.id === codeRecord.formClassId;
          return true;
        });

        for (const classRecord of targetClasses) {
          assignments.push(createAssignment({
            teacherUsername: username,
            classId: classRecord.id,
            subjectId: subject.id
          }));
        }
      }

      await Promise.all(assignments);
    }

    // 7. Mark registration code as used
    await markCodeAsUsed(payload.registrationCode, username);

    // 8. Log activity
    await logActivity({
      actor: username,
      role: Roles.TEACHER,
      action: "Teacher self-registration",
      details: { 
        email: payload.email,
        registrationCode: payload.registrationCode,
        subjectCount: payload.teacherType === "SUBJECT_TEACHER" ? payload.subjectIds.length : 0,
        formClassId: payload.teacherType === "FORM_TEACHER" ? payload.formClassId : null
      },
      resourceType: "registration",
      resourceId: username
    }).catch((error) => console.error("Activity log failed:", error));

    let emailSent = false;
    let emailError = null;
    try {
      await sendTeacherWelcomeEmail({
        teacherEmail: payload.email,
        teacherName: payload.displayName,
        username,
        subjectCount: payload.teacherType === "SUBJECT_TEACHER" ? payload.subjectIds.length : 0,
        hasFormClass: payload.teacherType === "FORM_TEACHER"
      });
      emailSent = true;
    } catch (error) {
      emailError = "Your account was created, but the login email could not be sent. Contact the school administrator.";
      console.error(`Failed to send teacher welcome email to ${payload.email}:`, error?.message || error);
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Account created successfully. Your teacher code was sent by email."
        : "Account created successfully, but the login email could not be sent.",
      user: {
        username,
        email: payload.email,
        displayName: payload.displayName,
        role: Roles.TEACHER,
        portal: "TEACHER",
        subjectsAssigned: payload.teacherType === "SUBJECT_TEACHER" ? payload.subjectIds.length : 0,
        formClassAssigned: payload.teacherType === "FORM_TEACHER",
        emailSent,
        emailError
      }
    });
  })
);
