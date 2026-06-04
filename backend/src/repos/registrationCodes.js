import { SafeDatabase } from "../firestore-utils/index.js";

/**
 * Get a registration code by code value
 */
export async function getRegistrationCodeByCode(code) {
  try {
    const normalized = String(code).trim().toUpperCase();
    const { data } = await SafeDatabase.query(
      "registrationCodes",
      [["code", "==", normalized]],
      { pageSize: 1 }
    );
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error fetching registration code:", error);
    throw error;
  }
}

/**
 * Create a new registration code with teacher allocations
 */
export async function createRegistrationCode(codeData) {
  try {
    const docId = String(codeData.code).trim().toUpperCase();
    return await SafeDatabase.createWithValidation(
      "registrationCodes",
      {
        code: docId,
        displayName: codeData.displayName,
        email: codeData.email || null,
        subjectIds: Array.isArray(codeData.subjectIds) ? codeData.subjectIds : [],
        formClassId: codeData.formClassId || null,
        createdAt: new Date().toISOString(),
        expiresAt: codeData.expiresAt || null,
        used: false,
        usedBy: null,
        usedAt: null,
        status: "ACTIVE" // ACTIVE, USED, EXPIRED, REVOKED
      },
      "registrationCode",
      { docId }
    );
  } catch (error) {
    console.error("Error creating registration code:", error);
    throw error;
  }
}

/**
 * Mark a registration code as used
 */
export async function markCodeAsUsed(code, username) {
  try {
    const normalized = String(code).trim().toUpperCase();
    return await SafeDatabase.updateWithValidation(
      "registrationCodes",
      normalized,
      {
        used: true,
        usedBy: username,
        usedAt: new Date().toISOString(),
        status: "USED"
      },
      "registrationCode"
    );
  } catch (error) {
    console.error("Error marking code as used:", error);
    throw error;
  }
}

/**
 * List all registration codes
 */
export async function listRegistrationCodes(filters = {}) {
  try {
    const query = [];
    if (filters.status) query.push(["status", "==", filters.status]);
    if (filters.used !== undefined) query.push(["used", "==", filters.used]);
    
    const { data } = await SafeDatabase.query("registrationCodes", query, { pageSize: 100 });
    return data;
  } catch (error) {
    console.error("Error listing registration codes:", error);
    throw error;
  }
}

/**
 * Get registration codes for a specific teacher
 */
export async function getCodesForTeacher(displayName) {
  try {
    const { data } = await SafeDatabase.query(
      "registrationCodes",
      [["displayName", "==", displayName]],
      { pageSize: 100 }
    );
    return data;
  } catch (error) {
    console.error("Error fetching codes for teacher:", error);
    throw error;
  }
}

/**
 * Revoke a registration code
 */
export async function revokeRegistrationCode(code) {
  try {
    const normalized = String(code).trim().toUpperCase();
    return await SafeDatabase.updateWithValidation(
      "registrationCodes",
      normalized,
      {
        status: "REVOKED"
      },
      "registrationCode"
    );
  } catch (error) {
    console.error("Error revoking registration code:", error);
    throw error;
  }
}

/**
 * Check if code is valid and can be used
 */
export async function isCodeValid(code) {
  try {
    const codeRecord = await getRegistrationCodeByCode(code);
    if (!codeRecord) return false;
    
    // Check if already used
    if (codeRecord.used) return false;
    
    // Check if revoked
    if (codeRecord.status === "REVOKED") return false;
    
    // Check if expired
    if (codeRecord.expiresAt) {
      const expiryDate = new Date(codeRecord.expiresAt);
      if (new Date() > expiryDate) return false;
    }
    
    // Check if status is ACTIVE
    if (codeRecord.status !== "ACTIVE") return false;
    
    return true;
  } catch (error) {
    console.error("Error validating code:", error);
    return false;
  }
}
