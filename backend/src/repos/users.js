import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";

export async function getUserByUsername(username) {
  try {
    const normalized = String(username).toLowerCase().trim();
    return await SafeDatabase.getById("users", normalized);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function createUser(user) {
  return SafeDatabase.createWithValidation("users", user, "user", { checkDuplicates: true });
}

export async function updateUser(username, patch) {
  const normalized = String(username).toLowerCase().trim();
  return SafeDatabase.updateWithValidation("users", normalized, patch, "user");
}

export async function deleteUser(username) {
  const normalized = String(username).toLowerCase().trim();
  return SafeDatabase.deleteWithValidation("users", normalized);
}
