import { normalizeLevel } from "./subjectAliases.js";

function subjectNames(subject) {
  return [subject?.name, subject?.originalName]
    .map((name) => String(name || "").trim().toUpperCase().replace(/\s+/g, " "))
    .filter(Boolean);
}

function isVocationalSubject(subject) {
  return subjectNames(subject).some((name) => /\bVOCATIONAL\b/.test(name));
}

function isCrkSubject(subject) {
  return subjectNames(subject).some((name) => {
    const normalized = name.replace(/\s*\(CRK\)\s*/g, " ").replace(/[().]/g, "").trim();
    return normalized === "CRK" ||
      normalized.startsWith("CRK ") ||
      normalized.includes("CHRISTIAN RELIGIOUS KNOWLEDGE") ||
      /\bIRK\b/.test(normalized) ||
      normalized.includes("ISLAMIC RELIGIOUS KNOWLEDGE");
  });
}

function isNurseryOneOrTwo(cls) {
  return /\bNURSERY\s*[ -]?[12]\b/i.test(String(cls?.name || ""));
}

function isSubjectNamed(subject, expectedName) {
  return subjectNames(subject).some((name) => name === expectedName);
}

function isPrimaryOneToThree(cls) {
  return /\b(?:PRIMARY|PRY)\s*[ -]?\s*[1-3]\b/i.test(String(cls?.name || ""));
}

export function isSubjectAvailableForClass(subject, cls) {
  const excludedClassIds = Array.isArray(subject?.excludedClassIds)
    ? subject.excludedClassIds.map(String)
    : [];
  if (excludedClassIds.includes(String(cls?.id || ""))) return false;

  const classLevel = normalizeLevel(cls?.level || cls?.name);
  if (classLevel === "Primary" && isVocationalSubject(subject)) return false;
  if (classLevel === "Primary" && isPrimaryOneToThree(cls) && isCrkSubject(subject)) return false;
  if (classLevel === "Nursery" && isCrkSubject(subject)) return false;
  if (classLevel === "Nursery" && isSubjectNamed(subject, "SPELLING") && !isNurseryOneOrTwo(cls)) return false;

  return true;
}
