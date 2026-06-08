import express from "express";
import { asyncHandler } from "../http.js";
import { getUserByUsername, getUserByEmail, createUser } from "../repos/users.js";
import { verifyPassword, signJwt, hashPassword } from "../security.js";
import { Roles } from "../constants.js";
import { logActivity } from "../services/activityLog.js";
import { generateTeacherUsername } from "../ids.js";
import { validateTeacherRegistration } from "../validation.js";
import { sendTeacherWelcomeEmail } from "../services/email.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { getRegistrationCodeByCode, markCodeAsUsed, isCodeValid } from "../repos/registrationCodes.js";

export const authRouter = express.Router();

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
// Uses registration code to auto-assign subjects and form class
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

    // 3. Verify email matches the code (if email was pre-assigned)
    if (codeRecord.email && codeRecord.email.toLowerCase() !== payload.email.toLowerCase()) {
      return res.status(400).json({ 
        error: "Email does not match the registration code",
        code: "EMAIL_MISMATCH"
      });
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

    // 5. Use registration code as username
    // The code is already in format tch-2026-NNN (e.g., tch-2026-001)
    const username = payload.registrationCode.toLowerCase();
    const passwordHash = await hashPassword(payload.password);

    // 6. Create user record with allocations from code
    await createUser({
      username,
      email: payload.email,
      portal: "TEACHER",
      role: Roles.TEACHER,
      displayName: payload.displayName,
      passwordHash,
      formClassId: codeRecord.formClassId || null,
      subjectIds: codeRecord.subjectIds || [],
      registrationCodeUsed: payload.registrationCode
    }, { docId: username });

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
        subjectCount: (codeRecord.subjectIds || []).length,
        formClassId: codeRecord.formClassId
      },
      resourceType: "registration",
      resourceId: username
    }).catch((error) => console.error("Activity log failed:", error));

    // 9. Send welcome email in background
    sendTeacherWelcomeEmail({
      teacherEmail: payload.email,
      teacherName: payload.displayName,
      username: username,
      subjectCount: (codeRecord.subjectIds || []).length,
      hasFormClass: !!codeRecord.formClassId
    }).then(() => {
      console.log(`✅ Welcome email sent successfully to ${payload.email}`);
    }).catch((err) => {
      console.error(`❌ Failed to send welcome email to ${payload.email}:`, err?.message || err);
    });

    return res.status(201).json({
      success: true,
      message: "✅ Account created successfully! You can now login with your credentials.",
      user: {
        username,
        email: payload.email,
        displayName: payload.displayName,
        role: Roles.TEACHER,
        portal: "TEACHER",
        subjectsAssigned: (codeRecord.subjectIds || []).length,
        formClassAssigned: !!codeRecord.formClassId
      }
    });
  })
);

