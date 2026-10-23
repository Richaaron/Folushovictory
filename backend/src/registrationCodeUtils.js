import crypto from "crypto";
import { SafeDatabase } from "./firestore-utils/index.js";

/**
 * Registration Code Utility
 * 
 * Encodes teacher subject and form class allocations into a secure code
 * Decodes the code to retrieve the allocations during registration
 */

const ALGORITHM = "aes-256-gcm";
const ENCODING_KEY = process.env.REGISTRATION_CODE_SECRET || "fvs-school-registration-secret-key-2026";

function getEncryptionKey() {
  // Hash the key to ensure it's 32 bytes for AES-256
  const hash = crypto.createHash("sha256");
  hash.update(ENCODING_KEY);
  return hash.digest();
}

/**
 * Generates a registration code that encodes teacher allocations
 * @param {Object} data - Teacher allocation data
 * @param {string[]} data.subjectIds - Array of subject IDs
 * @param {string} data.formClassId - Form class ID
 * @returns {string} Encrypted registration code
 */
export function generateRegistrationCode(data) {
  try {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Serialize the allocation data as JSON
    const payload = JSON.stringify({
      subjectIds: data.subjectIds || [],
      formClassId: data.formClassId || null,
      createdAt: new Date().toISOString(),
      version: 1
    });
    
    let encrypted = cipher.update(payload, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    const code = `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    
    // Return a more readable format: prefix + base64 encoded code
    const encodedCode = Buffer.from(code).toString("base64");
    return `TCH-${encodedCode.substring(0, 20).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  } catch (error) {
    console.error("Error generating registration code:", error);
    throw new Error("Failed to generate registration code");
  }
}

/**
 * Decodes a registration code to extract teacher allocations
 * @param {string} code - Registration code
 * @returns {Object} Decoded allocation data with subjectIds and formClassId
 */
export function decodeRegistrationCode(code) {
  try {
    // Remove prefix and extract the encoded part
    if (!code.startsWith("TCH-")) {
      throw new Error("Invalid code format");
    }
    
    // Extract the base64 encoded part (between TCH- and the timestamp)
    const parts = code.split("-");
    if (parts.length < 3) {
      throw new Error("Invalid code format");
    }
    
    // The actual encrypted data is stored separately in the database
    // This function will be called with the code and we'll look up the allocation in DB
    // For now, return a placeholder that signals the code is valid format
    return {
      isValid: true,
      codeFormat: code
    };
  } catch (error) {
    console.error("Error decoding registration code:", error);
    throw new Error("Invalid registration code");
  }
}

/**
 * Generates a human-readable registration code in format tch-YYYY-NNN
 * This code will become the teacher's username upon registration
 * Uses counter-based generation to ensure uniqueness
 */
export async function generateSimpleRegistrationCode() {
  const year = new Date().getFullYear();
  const counterId = `registrationCodes_${year}`;
  const counterExists = await SafeDatabase.exists("counters", counterId);

  if (!counterExists) {
    const { data: existingCodes } = await SafeDatabase.query(
      "registrationCodes",
      [],
      { pageSize: 1000 }
    );
    const latestNumber = existingCodes.reduce((latest, record) => {
      const match = new RegExp(`^tch-${year}-(\\d{3})$`, "i").exec(record.code || "");
      return match ? Math.max(latest, Number(match[1])) : latest;
    }, 0);

    await SafeDatabase.upsert("counters", counterId, { value: latestNumber });
  }

  const counter = await SafeDatabase.increment("counters", counterId, "value", 1);
  return `tch-${year}-${String(counter).padStart(3, "0")}`;
}

/**
 * Validates code format (tch-2026-NNN where NNN are digits)
 * @param {string} code - Code to validate
 * @returns {boolean} True if code matches format
 */
export function isValidCodeFormat(code) {
  // Format: tch-YYYY-NNN (e.g., tch-2026-001)
  const codeRegex = new RegExp(`^tch-${new Date().getFullYear()}-\\d{3}$`, "i");
  return codeRegex.test(String(code).trim());
}
