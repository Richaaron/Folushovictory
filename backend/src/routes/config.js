import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { Roles } from "../constants.js";
import { getSchoolSettings, setSchoolSettings } from "../repos/config.js";

export const configRouter = express.Router();

// Get school settings (public endpoint)
configRouter.get(
  "/config/school-settings",
  asyncHandler(async (req, res) => {
    const settings = await getSchoolSettings();
    return res.json(settings);
  })
);

// Legacy endpoint - keeping for backward compatibility
configRouter.get(
  "/config/school",
  asyncHandler(async (req, res) => {
    const settings = await getSchoolSettings();
    return res.json(settings);
  })
);

// Update school settings (admin only)
configRouter.post(
  "/config/school-settings",
  authRequired,
  requireRole(Roles.ADMIN),
  asyncHandler(async (req, res) => {
    const {
      name,
      motto,
      address,
      phone,
      email,
      website,
      principalName,
      logo,
      logoUrl,
      principalSignature,
      principalSignatureUrl,
      currentSession,
      currentTerm
    } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (motto !== undefined) updateData.motto = motto;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (principalName !== undefined) updateData.principalName = principalName;
    if (currentSession !== undefined) updateData.currentSession = currentSession;
    if (currentTerm !== undefined) updateData.currentTerm = currentTerm;

    // Handle logo upload (base64 or data URL)
    const nextLogoUrl = logoUrl || logo;
    if (nextLogoUrl && typeof nextLogoUrl === 'string') {
      updateData.logoUrl = nextLogoUrl;
    }

    // Handle principal signature upload (base64 or data URL)
    const nextPrincipalSignatureUrl = principalSignatureUrl || principalSignature;
    if (nextPrincipalSignatureUrl && typeof nextPrincipalSignatureUrl === 'string') {
      updateData.principalSignatureUrl = nextPrincipalSignatureUrl;
    }

    const settings = await setSchoolSettings(updateData);
    return res.json(settings);
  })
);

// Legacy endpoint - keeping for backward compatibility
configRouter.post(
  "/config/school",
  authRequired,
  requireRole(Roles.ADMIN),
  asyncHandler(async (req, res) => {
    const settings = await setSchoolSettings(req.body);
    return res.json(settings);
  })
);
