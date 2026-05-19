import { assertConfig } from "../src/config.js";
import { getFirebaseApp, getDb } from "../src/firebase.js";

assertConfig();
getFirebaseApp();

const db = getDb();

const SECONDARY_LEVELS = new Set(["JSS", "SSS", "SECONDARY"]);
const RENAMES = new Map([
  ["Basic Science", "Intermidiate Science"],
  ["Computer Science", "Digital Technology"],
  ["Computer Studies", "Digital Technology"],
  ["Civic Education", "Citizenship and Heritage studies"],
  ["Agricultural Science", "Livestock Studies"],
  ["Agriculture Science", "Livestock Studies"]
]);
const REMOVE = new Set(["Basic Technology"]);

function isSecondary(level) {
  return SECONDARY_LEVELS.has(String(level || "").trim().toUpperCase());
}

const snapshot = await db.collection("subjects").get();
const subjects = snapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
const existing = new Set(
  subjects
    .filter((subject) => isSecondary(subject.level))
    .map((subject) => `${subject.level}|${subject.name}`)
);

let renamed = 0;
let removed = 0;
let skippedDuplicates = 0;

for (const subject of subjects) {
  if (!isSecondary(subject.level)) continue;

  if (REMOVE.has(subject.name)) {
    await subject.ref.delete();
    removed += 1;
    process.stdout.write(`Removed ${subject.name} (${subject.level})\n`);
    continue;
  }

  const nextName = RENAMES.get(subject.name);
  if (!nextName || nextName === subject.name) continue;

  const nextKey = `${subject.level}|${nextName}`;
  if (existing.has(nextKey)) {
    await subject.ref.delete();
    skippedDuplicates += 1;
    process.stdout.write(`Removed duplicate ${subject.name} (${subject.level}); ${nextName} already exists\n`);
    continue;
  }

  await subject.ref.update({
    name: nextName,
    updatedAt: new Date().toISOString()
  });
  existing.delete(`${subject.level}|${subject.name}`);
  existing.add(nextKey);
  renamed += 1;
  process.stdout.write(`Renamed ${subject.name} -> ${nextName} (${subject.level})\n`);
}

process.stdout.write(
  `Secondary subject update complete. Renamed: ${renamed}, removed: ${removed}, duplicate removals: ${skippedDuplicates}\n`
);
