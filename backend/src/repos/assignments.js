import { SafeDatabase } from "../firestore-utils/index.js";

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

  const operations = assignments.map(a => ({
    type: "delete",
    collectionName: "assignments",
    docId: a.id
  }));

  await SafeDatabase.batchWrite(operations);
  
  return { success: true, operationCount: assignments.length };
}
