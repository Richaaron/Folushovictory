import { isReligiousStudiesAlias, normalizeLevel, RELIGIOUS_STUDIES_NAME } from "./subjectAliases.js";

const CORE_SSS_SUBJECTS = new Set([
  "MATHEMATICS",
  "ENGLISH LANGUAGE",
  "MARKETING",
  "CITIZENSHIP AND HERITAGE STUDIES",
  "ECONOMICS",
  "BIOLOGY",
  "CIVIC EDUCATION"
]);

const TRACK_SUBJECTS = {
  SCIENCE: ["CHEMISTRY", "PHYSICS"],
  ART: ["GOVERNMENT", "LITERATURE IN ENGLISH"],
  COMMERCIAL: ["FINANCIAL ACCOUNTING", "COMMERCE"]
};

const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ").toUpperCase();

export function subjectIsReligious(subject) {
  return [subject?.name, subject?.originalName]
    .map(normalizeName)
    .some((name) => name === normalizeName(RELIGIOUS_STUDIES_NAME) || isReligiousStudiesAlias(name));
}

export function studentOffersSubject(student, cls, subject, subjectIds = [String(subject?.id || "")]) {
  const selectedIds = Array.isArray(student?.subjectIds) ? student.subjectIds.map(String) : [];
  if ((subjectIds || []).some((id) => selectedIds.includes(String(id)))) return true;

  const subjectNames = [subject?.name, subject?.originalName].map(normalizeName).filter(Boolean);
  const level = normalizeLevel(cls?.level || cls?.name);

  if (level === "SSS") {
    if (subjectNames.some((name) => CORE_SSS_SUBJECTS.has(name))) return true;

    const configuredTrack = normalizeName(subject?.track);
    const nameTrack = Object.entries(TRACK_SUBJECTS)
      .find(([, names]) => names.some((name) => subjectNames.includes(name)))?.[0];
    const requiredTrack = configuredTrack && configuredTrack !== "GENERAL" ? configuredTrack : nameTrack;

    if (requiredTrack) return normalizeName(student?.stream) === requiredTrack;
    return false;
  }

  // Religious Studies variants are elective in lower classes; missing legacy
  // subject selections must not expose them to the entire class.
  if (subjectIsReligious(subject)) return false;

  // Older lower-school records can lack subjectIds because those classes share
  // a common curriculum. Preserve that behavior only for those legacy records.
  return selectedIds.length === 0;
}
