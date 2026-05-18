import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { executeBatch } from "../firestore-utils/transaction-helpers.js";

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
  const { data } = await SafeDatabase.query(
    "classes",
    [["formTeacherUsername", "==", normalized]],
    { pageSize: 1000 }
  );
  return data;
}

export async function revokeFormTeacherStatus(username) {
  const normalized = username ? String(username).toLowerCase().trim() : "";
  const classes = await listClassesByFormTeacher(username);
  
  return executeBatch(async (batch) => {
    for (const classDoc of classes) {
      const ref = getDb().collection("classes").doc(classDoc.id);
      batch.update(ref, {
        formTeacherUsername: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}
