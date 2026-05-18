import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { executeTransaction } from "../firestore-utils/transaction-helpers.js";

export async function createStudent(student) {
  return SafeDatabase.createWithValidation("students", student, "student", { checkDuplicates: true });
}

export async function createStudentWithParent({ student, parentUser }) {
  return executeTransaction(async (tx) => {
    const studentRef = getDb().collection("students").doc(student.studentId);
    const parentRef = getDb().collection("users").doc(parentUser.username);

    const [studentSnap, parentSnap] = await Promise.all([tx.get(studentRef), tx.get(parentRef)]);
    if (studentSnap.exists) {
      const error = new Error(`Student with ID ${student.studentId} already exists`);
      error.statusCode = 409;
      throw error;
    }
    if (parentSnap.exists) {
      const error = new Error(`Parent username ${parentUser.username} already exists`);
      error.statusCode = 409;
      throw error;
    }

    tx.create(studentRef, {
      ...student,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    tx.create(parentRef, {
      ...parentUser,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

export async function listStudentsByClass(classId) {
  const { data } = await SafeDatabase.query(
    "students",
    [["classId", "==", classId]],
    { pageSize: 1000, orderBy: "lastName", orderDirection: "asc" }
  );
  return data;
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
  return SafeDatabase.updateWithValidation("students", studentId, patch, "student");
}

export async function deleteStudent(studentId) {
  return SafeDatabase.deleteWithValidation("students", studentId, {
    validateBeforeDelete: async () => {
      const scoreCount = await SafeDatabase.count("scores", [["studentId", "==", studentId]]);
      const assignmentCount = await SafeDatabase.count("assignments", [["studentId", "==", studentId]]);
      
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
