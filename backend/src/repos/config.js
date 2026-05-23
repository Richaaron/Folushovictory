import { SafeDatabase } from "../firestore-utils/index.js";

const defaultSchoolSettings = {
  name: "Folusho Victory Schools",
  motto: "Knowledge - Integrity - Excellence",
  address: "",
  phone: "",
  email: "",
  website: "",
  principalName: "",
  principalSignatureUrl: "/principal-signature.png",
  logoUrl: "",
  currentSession: "2023/2024",
  currentTerm: "First"
};

const schoolSettingFields = [
  "name",
  "motto",
  "address",
  "phone",
  "email",
  "website",
  "principalName",
  "principalSignatureUrl",
  "logoUrl",
  "currentSession",
  "currentTerm"
];

function normalizeSchoolSettings(settings = {}) {
  const normalized = {};
  for (const field of schoolSettingFields) {
    if (settings[field] !== undefined && settings[field] !== null) {
      normalized[field] = String(settings[field]);
    }
  }
  return normalized;
}

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
    const settings = await SafeDatabase.getById("config", "schoolSettings");
    return {
      ...defaultSchoolSettings,
      ...settings,
      principalSignatureUrl: settings.principalSignatureUrl !== undefined && settings.principalSignatureUrl !== null 
        ? settings.principalSignatureUrl 
        : defaultSchoolSettings.principalSignatureUrl
    };
  } catch (error) {
    if (error.statusCode === 404) return defaultSchoolSettings;
    throw error;
  }
}

export async function setSchoolSettings(settings) {
  await SafeDatabase.upsert("config", "schoolSettings", normalizeSchoolSettings(settings));
  return getSchoolSettings();
}
