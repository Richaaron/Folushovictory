import { SafeDatabase } from "../firestore-utils/index.js";
import { canonicalizeSubject, canonicalizeSubjectPayload } from "../subjectAliases.js";

export async function createSubject(data) {
  const created = await SafeDatabase.createWithValidation("subjects", canonicalizeSubjectPayload(data), "subject", { checkDuplicates: true });
  return canonicalizeSubject(created);
}

export async function listSubjects() {
  const { data } = await SafeDatabase.query(
    "subjects",
    [],
    { pageSize: 1000, orderBy: "name", orderDirection: "asc" }
  );
  return data.map(canonicalizeSubject);
}

export async function getSubjectById(subjectId) {
  try {
    return canonicalizeSubject(await SafeDatabase.getById("subjects", subjectId));
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function getSubjectByName(name) {
  const { data } = await SafeDatabase.query(
    "subjects",
    [["name", "==", canonicalizeSubjectPayload({ name }).name]],
    { pageSize: 1 }
  );
  return data.length > 0 ? canonicalizeSubject(data[0]) : null;
}

