import express from "express";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { getUserByUsername, updateUser } from "../repos/users.js";
import { verifyPassword, hashPassword } from "../security.js";

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

meRouter.post(
  "/change-password",
  authRequired,
  asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });

    const user = await getUserByUsername(req.user.username);
    const valid = await verifyPassword(oldPassword, user.passwordHash);
    if (!valid) return res.status(403).json({ error: "Incorrect current password" });

    const passwordHash = await hashPassword(newPassword);
    await updateUser(req.user.username, { passwordHash });

    return res.json({ ok: true });
  })
);

