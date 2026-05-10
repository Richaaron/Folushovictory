import { verifyJwt } from "../security.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = verifyJwt(token);
    req.user = {
      username: decoded.sub,
      role: decoded.role,
      portal: decoded.portal,
      studentId: decoded.studentId || null
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

