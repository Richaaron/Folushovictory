import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { executeBatch } from "../firestore-utils/transaction-helpers.js";

export async function createAssignment(data) {
  return SafeDatabase.createWithValidation("assignments", data, "assignment", { checkDuplicates: false });
}

export async function listAssignmentsByTeacher(teacherUsername) {
  const normalized = teacherUsername ? String(teacherUsername).toLowerCase().trim() : "";
  const original = teacherUsername ? String(teacherUsername).trim() : "";
  
  const [lowerSnap, upperSnap] = await Promise.all([
    SafeDatabase.query("assignments", [["teacherUsername", "==", normalized]], { pageSize: 1000 }),
    original !== normalized ? SafeDatabase.query("assignments", [["teacherUsername", "==", original]], { pageSize: 1000 }) : { data: [] }
  ]);
  
  // Merge and deduplicate
  const allData = [...lowerSnap.data, ...(upperSnap?.data || [])];
  const unique = new Map();
  for (const a of allData) {
    if (!unique.has(a.id)) unique.set(a.id, a);
  }
  
  return Array.from(unique.values());
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
  const assignments = await listAssignmentsByTeacher(teacherUsername);
  console.log(`[AssignmentsRepo] Found ${assignments.length} assignments to delete for ${teacherUsername}`);
  
  if (assignments.length === 0) return { success: true, operationCount: 0 };

  // Firestore batches are limited to 500 operations. 
  // If a teacher has many assignments, we need to delete them in chunks.
  const CHUNK_SIZE = 450;
  for (let i = 0; i < assignments.length; i += CHUNK_SIZE) {
    const chunk = assignments.slice(i, i + CHUNK_SIZE);
    await executeBatch(async (batch) => {
      for (const assignment of chunk) {
        const ref = getDb().collection("assignments").doc(assignment.id);
        batch.delete(ref);
      }
    });
  }
  
  return { success: true, operationCount: assignments.length };
}
