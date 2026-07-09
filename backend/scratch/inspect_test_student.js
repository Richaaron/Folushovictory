import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { mergeCanonicalSubjects, normalizeLevel } from "../src/subjectAliases.js";
import { numericBroadsheet } from "../src/compute.js";
import { getGradingScale } from "../src/repos/config.js";

assertConfig();

async function run() {
  const classId = "P2SWpXEL3F6lImacvkqU"; // JSS 1
  const session = "2025/2026";
  const term = "3rd";

  const cls = await SafeDatabase.getById("classes", classId);
  const students = await SafeDatabase.query("students", [["classId", "==", classId]], { pageSize: 100 }).then(r => r.data);
  const allSubjects = await SafeDatabase.query("subjects", [], { pageSize: 1000 }).then(r => r.data);
  const scores = await SafeDatabase.query("scores", [
    ["session", "==", session],
    ["term", "==", term],
    ["classId", "==", classId]
  ], { pageSize: 1000 }).then(r => r.data);
  const scale = await getGradingScale();

  let subjects;
  if (Array.isArray(cls.subjectIds) && cls.subjectIds.length) {
    // ...
  } else {
    const levelFilter = normalizeLevel(cls.level);
    let filtered = allSubjects.filter((s) => normalizeLevel(s.level) === levelFilter);
    subjects = mergeCanonicalSubjects(filtered.map((s) => ({ id: s.id, name: s.name, track: s.track || null, level: s.level || null })));
  }

  const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
  const sheet = numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

  const st = sheet.students.find(s => s.studentId === "fvs-2026-0029");
  if (st) {
    console.log(`Student fvs-2026-0029: ${st.firstName} ${st.lastName}`);
    console.log(`Religious Studies score object:`, JSON.stringify(st.scores["FIfbYI2YmfYx3JXoN0cW"], null, 2));
  } else {
    console.log("Student fvs-2026-0029 not found in broadsheet!");
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
