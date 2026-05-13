import express from "express";
import { asyncHandler } from "../http.js";
import { getUserByUsername } from "../repos/users.js";
import { verifyPassword, signJwt } from "../security.js";

export const authRouter = express.Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { portal, username, password } = req.body || {};
    if (!portal || !username || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await getUserByUsername(String(username).trim());
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.portal && portal && String(user.portal).toUpperCase() !== String(portal).toUpperCase()) {
      return res.status(403).json({ error: "Wrong portal" });
    }

    const ok = await verifyPassword(password, user.passwordHash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({
      sub: user.username,
      role: user.role,
      portal: user.portal,
      studentId: user.studentId || null
    });
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

