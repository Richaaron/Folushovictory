import express from "express";
import { asyncHandler } from "../http.js";
import { validateTeacherPayload } from "../validation.js";
import { generateSimpleRegistrationCode } from "../registrationCodeUtils.js";
import { createRegistrationCode, listRegistrationCodes } from "../repos/registrationCodes.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { logActivity } from "../services/activityLog.js";
import { Roles } from "../constants.js";

export const devAdminRouter = express.Router();

// Local-only helper to generate a registration code without requiring admin auth.
// Enabled only when ENABLE_LOCAL_DEV_ROUTES=true and NODE_ENV!=production.
devAdminRouter.post(
  "/teachers",
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_LOCAL_DEV_ROUTES !== "true") {
      return res.status(404).json({ error: "Not found" });
    }

    // Restrict to local requests
    const ip = req.ip || req.connection.remoteAddress || "";
    const allowed = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
    if (!allowed.includes(ip)) {
      return res.status(403).json({ error: "Forbidden: dev route restricted to localhost" });
    }

    const payload = validateTeacherPayload(req.body || {});

    // Fallback generation for local dev: attempt to persist, but if DB tables are missing
    // just return a generated code without persisting so devs can test the flow.
    let code;
    try {
      const existing = await listRegistrationCodes();
      const counter = (Array.isArray(existing) ? existing.length : 0) + 1;
      const paddedNumber = String(counter).padStart(3, '0');
      code = `tch-2026-${paddedNumber}`;

      // Try to persist the registration code; if it fails due to missing tables, fallback below
      var codeRecord = await createRegistrationCode({
        code,
        displayName: payload.displayName,
        email: payload.email || null,
        subjectIds: [],
        formClassId: payload.formClassId || null,
        expiresAt: null
      });
    } catch (err) {
      console.warn('Dev route: failed to persist registration code, returning generated code only:', err?.message || err);
      // Generate a simple non-persisted code
      const rnd = Math.floor(Math.random() * 900) + 100;
      code = code || `tch-2026-${String(rnd).padStart(3, '0')}`;
      codeRecord = { code, displayName: payload.displayName, email: payload.email || null };
    }

    // Log as system/dev
    await logActivity({
      actor: "dev-local",
      role: Roles.ADMIN,
      action: "Generated teacher registration code (dev)",
      details: { code: codeRecord.code, displayName: codeRecord.displayName },
      resourceType: "registrationCode",
      resourceId: codeRecord.code
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      code: codeRecord.code,
      displayName: codeRecord.displayName,
      email: codeRecord.email || null
    });
  })
);

export default devAdminRouter;
