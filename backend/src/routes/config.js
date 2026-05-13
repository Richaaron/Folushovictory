import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { Roles } from "../constants.js";
import { getSchoolSettings, setSchoolSettings } from "../repos/config.js";

export const configRouter = express.Router();

configRouter.get(
  "/config/school",
  asyncHandler(async (req, res) => {
    const settings = await getSchoolSettings();
    return res.json(settings);
  })
);

configRouter.post(
  "/config/school",
  authRequired,
  requireRole(Roles.ADMIN),
  asyncHandler(async (req, res) => {
    const settings = await setSchoolSettings(req.body);
    return res.json(settings);
  })
);
