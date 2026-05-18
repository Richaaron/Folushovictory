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
    const { name, motto, address, phone, email, website, principalName, logo, principalSignature } = req.body;
    
    const updateData = {
      name: name || "",
      motto: motto || "",
      address: address || "",
      phone: phone || "",
      email: email || "",
      website: website || "",
      principalName: principalName || ""
    };

    // Handle logo upload (base64 or data URL)
    if (logo && typeof logo === 'string') {
      updateData.logoUrl = logo;
    }

    // Handle principal signature upload (base64 or data URL)
    if (principalSignature && typeof principalSignature === 'string') {
      updateData.principalSignatureUrl = principalSignature;
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
