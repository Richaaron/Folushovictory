import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";

export async function createSubject(data) {
  return SafeDatabase.createWithValidation("subjects", data, "subject", { checkDuplicates: true });
}

export async function listSubjects() {
  const { data } = await SafeDatabase.query(
    "subjects",
    [],
    { pageSize: 1000, orderBy: "name", orderDirection: "asc" }
  );
  return data;
}

export async function getSubjectById(subjectId) {
  try {
    return await SafeDatabase.getById("subjects", subjectId);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function getSubjectByName(name) {
  const { data } = await SafeDatabase.query(
    "subjects",
    [["name", "==", name]],
    { pageSize: 1 }
  );
  return data.length > 0 ? data[0] : null;
}

