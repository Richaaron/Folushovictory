import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";

export async function getGradingScale() {
  try {
    return await SafeDatabase.getById("config", "gradingScale");
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function setGradingScale(scale) {
  return SafeDatabase.upsert("config", "gradingScale", scale);
}

export async function getTermMeta({ session, term }) {
  try {
    return await SafeDatabase.getById("termMeta", `${session}_${term}`);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function setTermMeta({ session, term, resumptionDate }) {
  return SafeDatabase.upsert("termMeta", `${session}_${term}`, {
    session,
    term,
    resumptionDate
  });
}

export async function getSchoolSettings() {
  try {
    return await SafeDatabase.getById("config", "schoolSettings");
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        name: "Folusho Victory Schools",
        motto: "Knowledge · Integrity · Excellence",
        address: "",
        phone: "",
        email: "",
        principalName: "",
        principalSignatureUrl: "",
        currentSession: "2023/2024",
        currentTerm: "First"
      };
    }
    throw error;
  }
}

export async function setSchoolSettings(settings) {
  return SafeDatabase.upsert("config", "schoolSettings", settings);
}
