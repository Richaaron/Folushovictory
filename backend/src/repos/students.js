import { SafeDatabase } from "../firestore-utils/index.js";
import { getClassById } from "./classes.js";

function normalizeClassRef(value) {
  return String(value || "").trim().toLowerCase();
}

export async function createStudent(student) {
  return SafeDatabase.createWithValidation("students", student, "student", { checkDuplicates: true });
}

export async function createStudentWithParent({ student, parentUser }) {
  const normalizedStudentId = String(student.studentId).toLowerCase().trim();
  const normalizedParentUsername = String(parentUser.username).toLowerCase().trim();

  const existsStudent = await SafeDatabase.exists("students", normalizedStudentId);
  if (existsStudent) {
    const error = new Error(`Student with ID ${student.studentId} already exists`);
    error.statusCode = 409;
    throw error;
  }
  const existsParent = await SafeDatabase.exists("users", normalizedParentUsername);
  if (existsParent) {
    const error = new Error(`Parent username ${parentUser.username} already exists`);
    error.statusCode = 409;
    throw error;
  }

  await SafeDatabase.createWithValidation("students", {
    ...student,
    studentId: normalizedStudentId
  }, "student", { checkDuplicates: false, docId: normalizedStudentId });

  await SafeDatabase.createWithValidation("users", {
    ...parentUser,
    username: normalizedParentUsername
  }, "user", { checkDuplicates: false, docId: normalizedParentUsername });

  return { success: true };
}

export async function listStudentsByClass(classId) {
  let data;
  const normalizedClassId = normalizeClassRef(classId);
  let className = null;

  const cls = await getClassById(String(classId || "").trim()).catch(() => null);
  if (cls && cls.name) {
    className = normalizeClassRef(cls.name);
  }

  try {
    const result = await SafeDatabase.query(
      "students",
      [["classId", "==", classId]],
      { pageSize: 1000 }
    );
    data = result.data;
  } catch (error) {
    console.error("Class student query failed, falling back to in-memory filtering:", error?.message || error);
    const result = await SafeDatabase.query("students", [], { pageSize: 1000 });
    data = result.data.filter((student) => {
      const studentClassRef = normalizeClassRef(student.classId);
      return studentClassRef === normalizedClassId || (className && studentClassRef === className);
    });
  }

  if (!Array.isArray(data) || data.length === 0) {
    const result = await SafeDatabase.query("students", [], { pageSize: 1000 });
    data = result.data.filter((student) => {
      const studentClassRef = normalizeClassRef(student.classId);
      return studentClassRef === normalizedClassId || (className && studentClassRef === className);
    });
  }

  return data.sort((a, b) => {
    const last = String(a.lastName || "").localeCompare(String(b.lastName || ""), undefined, { sensitivity: "base" });
    if (last !== 0) return last;
    const first = String(a.firstName || "").localeCompare(String(b.firstName || ""), undefined, { sensitivity: "base" });
    if (first !== 0) return first;
    return String(a.studentId || "").localeCompare(String(b.studentId || ""), undefined, { numeric: true });
  });
}

export async function countStudentsByClass(classId) {
  try {
    return await SafeDatabase.count("students", [["classId", "==", classId]]);
  } catch (error) {
    console.error("Student count query failed, falling back to filtered count:", error?.message || error);
  }

  const normalizedClassId = normalizeClassRef(classId);
  const cls = await getClassById(String(classId || "").trim()).catch(() => null);
  const className = cls?.name ? normalizeClassRef(cls.name) : null;
  const result = await SafeDatabase.query("students", [], { pageSize: 1000 });
  return result.data.filter((student) => {
    const studentClassRef = normalizeClassRef(student.classId);
    return studentClassRef === normalizedClassId || (className && studentClassRef === className);
  }).length;
}

export async function getStudentById(studentId) {
  try {
    return await SafeDatabase.getById("students", studentId);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}


export async function updateStudent(studentId, patch) {
  const normalizedStudentId = String(studentId || "").toLowerCase().trim();
  return SafeDatabase.updateWithValidation("students", normalizedStudentId, patch, "student");
}

export async function deleteStudent(studentId) {
  const normalizedStudentId = String(studentId || "").toLowerCase().trim();
  return SafeDatabase.deleteWithValidation("students", normalizedStudentId, {
    validateBeforeDelete: async () => {
      const scoreCount = await SafeDatabase.count("scores", [["studentId", "==", normalizedStudentId]]);
      const assignmentCount = await SafeDatabase.count("assignments", [["studentId", "==", normalizedStudentId]]);
      
      if (scoreCount > 0) {
        return { allowed: false, reason: `Cannot delete student with ${scoreCount} score records` };
      }
      if (assignmentCount > 0) {
        return { allowed: false, reason: `Cannot delete student with ${assignmentCount} assignments` };
      }
      return { allowed: true, reason: null };
    }
  });
}
