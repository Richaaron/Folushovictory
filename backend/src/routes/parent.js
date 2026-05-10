import express from "express";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { getStudentById } from "../repos/students.js";

export const parentRouter = express.Router();

parentRouter.use(authRequired, requireRole(Roles.PARENT));

parentRouter.get(
  "/student",
  asyncHandler(async (req, res) => {
    if (!req.user.studentId) return res.status(404).json({ error: "Student link missing" });
    const student = await getStudentById(req.user.studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    return res.json({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      classId: student.classId
    });
  })
);

