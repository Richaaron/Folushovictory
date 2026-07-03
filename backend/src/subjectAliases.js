export const RELIGIOUS_STUDIES_NAME = "Religious Studies";

export function normalizeLevel(level) {
  const normalized = String(level || "").trim().toUpperCase();
  if (["PRY", "PRIMARY", "NUR"].includes(normalized) || normalized.startsWith("PRE")) return "Primary";
  if (normalized.startsWith("JSS") || normalized.includes("JUNIOR SECONDARY") || normalized.startsWith("JR")) return "JSS";
  if (normalized.startsWith("SSS") || normalized.includes("SENIOR SECONDARY") || normalized.startsWith("SR")) return "SSS";
  return normalized;
}

function cleanSubjectName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function isReligiousStudiesAlias(name) {
  const cleaned = cleanSubjectName(name);
  return /^(CRS|IRS)(\s+(JSS|SSS))?$/.test(cleaned);
}

export function canonicalSubjectName(name) {
  return isReligiousStudiesAlias(name) ? RELIGIOUS_STUDIES_NAME : String(name || "").trim();
}

export function canonicalizeSubject(subject) {
  if (!subject) return subject;
  const originalName = String(subject.name || "").trim();
  return {
    ...subject,
    originalName,
    name: canonicalSubjectName(originalName)
  };
}

export function canonicalizeSubjectPayload(data) {
  const name = canonicalSubjectName(data?.name);
  return {
    ...data,
    name,
    track: name === RELIGIOUS_STUDIES_NAME && normalizeLevel(data?.level) === "SSS"
      ? (data?.track || "General")
      : data?.track
  };
}

export function mergeCanonicalSubjects(subjects) {
  const grouped = new Map();

  for (const subject of subjects || []) {
    if (!subject) continue;
    const normalized = canonicalizeSubject(subject);
    const key = [
      normalizeLevel(normalized.level),
      normalized.track || "",
      cleanSubjectName(normalized.name)
    ].join("|");

    const existing = grouped.get(key);
    const aliasIds = [
      ...new Set([
        ...(existing?.aliasIds || []),
        existing?.id,
        normalized.id,
        ...(normalized.aliasIds || [])
      ].filter(Boolean))
    ];

    const preferred =
      existing && !isReligiousStudiesAlias(existing.originalName || existing.name)
        ? existing
        : normalized;

    grouped.set(key, {
      ...preferred,
      name: normalized.name,
      originalName: preferred.originalName || preferred.name,
      aliasIds
    });
  }

  return Array.from(grouped.values()).map((subject) => ({
    ...subject,
    aliasIds: subject.aliasIds?.filter((id) => id !== subject.id) || []
  }));
}
