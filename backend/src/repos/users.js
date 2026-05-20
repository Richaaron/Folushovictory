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
  let cleanUsername = String(username).trim();
  if (cleanUsername.startsWith("@")) {
    cleanUsername = cleanUsername.substring(1);
  }
  
  const normalized = cleanUsername.toLowerCase();
  const original = cleanUsername;

  // Try normalized first
  try {
    const exists = await SafeDatabase.exists("users", normalized);
    if (exists) return await SafeDatabase.deleteWithValidation("users", normalized);
  } catch (error) {
    if (error.statusCode !== 404) console.error(`Error checking user ${normalized}:`, error.message);
  }

  // Try original if different
  if (original !== normalized) {
    try {
      const exists = await SafeDatabase.exists("users", original);
      if (exists) return await SafeDatabase.deleteWithValidation("users", original);
    } catch (error) {
      if (error.statusCode !== 404) console.error(`Error checking user ${original}:`, error.message);
    }
  }

  // If still not deleted, try finding by 'username' field
  try {
    const { data } = await SafeDatabase.query("users", [["username", "==", original]], { pageSize: 1 });
    if (data.length > 0) return await SafeDatabase.deleteWithValidation("users", data[0].id);

    const { data: dataLower } = await SafeDatabase.query("users", [["username", "==", normalized]], { pageSize: 1 });
    if (dataLower.length > 0) return await SafeDatabase.deleteWithValidation("users", dataLower[0].id);
  } catch (error) {
    console.error(`Error finding user by field:`, error.message);
  }

  // If we reach here, either deleted or not found
  return { success: true, message: "User not found or already deleted" };
}
