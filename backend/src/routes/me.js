import express from "express";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { getUserByUsername } from "../repos/users.js";

export const meRouter = express.Router();

meRouter.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await getUserByUsername(req.user.username);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.json({
      username: user.username,
      role: user.role,
      portal: user.portal,
      displayName: user.displayName || "",
      studentId: user.studentId || null
    });
  })
);

