import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { executeBatch } from "../firestore-utils/transaction-helpers.js";

export async function createAssignment(data) {
  return SafeDatabase.createWithValidation("assignments", data, "assignment", { checkDuplicates: false });
}

export async function listAssignmentsByTeacher(teacherUsername) {
  const normalized = teacherUsername ? String(teacherUsername).toLowerCase().trim() : "";
  const { data } = await SafeDatabase.query(
    "assignments",
    [["teacherUsername", "==", normalized]],
    { pageSize: 1000 }
  );
  return data;
}

export async function listAssignmentsByClass(classId) {
  const { data } = await SafeDatabase.query(
    "assignments",
    [["classId", "==", classId]],
    { pageSize: 1000 }
  );
  return data;
}

export async function getAssignmentByTriplet({ teacherUsername, classId, subjectId }) {
  const normalized = teacherUsername ? String(teacherUsername).toLowerCase().trim() : "";
  const { data } = await SafeDatabase.query(
    "assignments",
    [
      ["teacherUsername", "==", normalized],
      ["classId", "==", classId],
      ["subjectId", "==", subjectId]
    ],
    { pageSize: 1 }
  );
  return data.length > 0 ? data[0] : null;
}

export async function getAssignmentById(assignmentId) {
  try {
    return await SafeDatabase.getById("assignments", assignmentId);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function deleteAssignmentsByTeacher(teacherUsername) {
  const normalized = teacherUsername ? String(teacherUsername).toLowerCase().trim() : "";
  const assignments = await listAssignmentsByTeacher(teacherUsername);
  
  return executeBatch(async (batch) => {
    for (const assignment of assignments) {
      const ref = getDb().collection("assignments").doc(assignment.id);
      batch.delete(ref);
    }
  });
}
