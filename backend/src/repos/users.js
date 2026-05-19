import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";

export async function getUserByUsername(username) {
  try {
    const normalized = String(username).toLowerCase().trim();
    return await SafeDatabase.getById("users", normalized);
  } catch (error) {
    if (error.statusCode === 404) {
      // Fallback for existing uppercase IDs
      try {
        const original = String(username).trim();
        if (original !== original.toLowerCase()) {
          return await SafeDatabase.getById("users", original);
        }
      } catch (e) {
        if (e.statusCode === 404) return null;
        throw e;
      }
      return null;
    }
    throw error;
  }
}

export async function createUser(user, options = {}) {
  const normalizedDocId = options.docId ? String(options.docId).toLowerCase().trim() : null;
  return SafeDatabase.createWithValidation("users", user, "user", { 
    checkDuplicates: true, 
    ...options,
    ...(normalizedDocId ? { docId: normalizedDocId } : {})
  });
}

export async function updateUser(username, patch) {
  const normalized = String(username).toLowerCase().trim();
  try {
    return await SafeDatabase.updateWithValidation("users", normalized, patch, "user");
  } catch (error) {
    if (error.statusCode === 404) {
      // Fallback for existing uppercase IDs
      const original = String(username).trim();
      if (original !== normalized) {
        return await SafeDatabase.updateWithValidation("users", original, patch, "user");
      }
    }
    throw error;
  }
}

export async function deleteUser(username) {
  const normalized = String(username).toLowerCase().trim();
  try {
    return await SafeDatabase.deleteWithValidation("users", normalized);
  } catch (error) {
    if (error.statusCode === 404) {
      // Fallback for existing uppercase IDs
      const original = String(username).trim();
      if (original !== normalized) {
        return await SafeDatabase.deleteWithValidation("users", original);
      }
    }
    throw error;
  }
}
