import { SafeDatabase } from "../firestore-utils/index.js";

export async function createClass(data) {
  return SafeDatabase.createWithValidation("classes", data, "class", { checkDuplicates: true });
}

export async function listClasses() {
  const { data } = await SafeDatabase.query(
    "classes",
    [],
    { pageSize: 1000, orderBy: "name", orderDirection: "asc" }
  );
  return data;
}

export async function getClassById(classId) {
  try {
    return await SafeDatabase.getById("classes", classId);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function updateClass(classId, patch) {
  return SafeDatabase.updateWithValidation("classes", classId, patch, "class");
}

export async function listClassesByFormTeacher(username) {
  const normalized = username ? String(username).toLowerCase().trim() : "";
  const original = username ? String(username).trim() : "";
  
  const [lowerSnap, upperSnap] = await Promise.all([
    SafeDatabase.query("classes", [["formTeacherUsername", "==", normalized]], { pageSize: 1000 }),
    original !== normalized ? SafeDatabase.query("classes", [["formTeacherUsername", "==", original]], { pageSize: 1000 }) : { data: [] }
  ]);
  
  // Merge and deduplicate
  const allData = [...lowerSnap.data, ...(upperSnap?.data || [])];
  const unique = new Map();
  for (const c of allData) {
    if (!unique.has(c.id)) unique.set(c.id, c);
  }
  
  return Array.from(unique.values());
}

export async function revokeFormTeacherStatus(username) {
  const classes = await listClassesByFormTeacher(username);
  if (classes.length === 0) return { success: true };

  const operations = classes.map(c => ({
    type: "update",
    collectionName: "classes",
    docId: c.id,
    data: { formTeacherUsername: null }
  }));

  return SafeDatabase.batchWrite(operations);
}
