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

export const SSS_GENERAL_CORE_SUBJECTS = [
  'MATHEMATICS',
  'ENGLISH LANGUAGE',
  'MARKETING',
  'CITIZENSHIP AND HERITAGE STUDIES',
  'ECONOMICS',
  'BIOLOGY',
  'CIVIC EDUCATION'
];

export const SSS_TRACK_SUBJECT_NAMES = {
  SCIENCE: ['CHEMISTRY', 'PHYSICS', 'FURTHER MATHEMATICS', 'TECHNICAL DRAWING'],
  ART: ['GOVERNMENT', 'LITERATURE IN ENGLISH', 'LITERATURE', 'HISTORY', 'VISUAL ARTS', 'FINE ART'],
  COMMERCIAL: ['FINANCIAL ACCOUNTING', 'COMMERCE', 'ACCOUNTING', 'BOOK KEEPING', 'OFFICE PRACTICE', 'STORE MANAGEMENT']
};

export function getSubjectCategory(subject, classLevel) {
  const level = normalizeLevel(classLevel || subject?.level);
  if (level !== 'SSS') return 'General Core';

  const subNameUpper = String(subject?.name || subject?.originalName || '').toUpperCase().trim();
  const subTrack = String(subject?.track || '').toUpperCase().trim();

  if (SSS_GENERAL_CORE_SUBJECTS.includes(subNameUpper)) {
    return 'General Core';
  }

  if (subTrack === 'SCIENCE' || SSS_TRACK_SUBJECT_NAMES.SCIENCE.includes(subNameUpper)) {
    return 'Science Arm';
  }
  if (subTrack === 'ART' || subTrack === 'ARTS' || SSS_TRACK_SUBJECT_NAMES.ART.includes(subNameUpper)) {
    return 'Art Arm';
  }
  if (subTrack === 'COMMERCIAL' || SSS_TRACK_SUBJECT_NAMES.COMMERCIAL.includes(subNameUpper)) {
    return 'Commercial Arm';
  }

  return 'Elective';
}

export function isStudentEligibleForSubject(student, subject, cls) {
  if (!student || !subject) return false;
  const level = normalizeLevel(cls?.level || cls?.name || subject?.level);

  const selectedIds = Array.isArray(student.subjectIds) ? student.subjectIds.map(String) : [];
  const subjectIds = [subject.id, ...(subject.aliasIds || [])].map(String).filter(Boolean);

  // 1. Explicit registration in student.subjectIds: ALWAYS eligible
  if (subjectIds.some(id => selectedIds.includes(id))) {
    return true;
  }

  // If not Senior Secondary (SSS), handle Religious Studies or return true
  if (level !== 'SSS') {
    const isCRS = isCrkSubject(subject) || isSubjectNamed(subject, 'CRS') || String(subject?.name || '').toUpperCase().includes('CHRISTIAN');
    const isIRS = isSubjectNamed(subject, 'IRS') || String(subject?.name || '').toUpperCase().includes('ISLAMIC');
    if (isCRS || isIRS) {
      if (selectedIds.length > 0) {
        return subjectIds.some(id => selectedIds.includes(id));
      }
      return true;
    }
    // All other JSS/Primary subjects are general for the class
    return true;
  }

  // SSS Level logic
  const category = getSubjectCategory(subject, 'SSS');

  // General Core is offered by all SSS students
  if (category === 'General Core') {
    return true;
  }

  const studentStream = String(student.stream || cls?.track || '').toUpperCase().trim();

  // Specific Arms (Departmental)
  if (category === 'Science Arm') {
    return studentStream === 'SCIENCE';
  }
  if (category === 'Art Arm') {
    return studentStream === 'ART' || studentStream === 'ARTS';
  }
  if (category === 'Commercial Arm') {
    return studentStream === 'COMMERCIAL';
  }

  // Elective subjects (Livestock Studies, Geography, CRS, IRS, Trade crafts, etc.)
  // Only students who have registered for it (checked in step 1) offer it!
  return false;
}
