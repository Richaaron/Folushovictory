import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { mergeCanonicalSubjects, normalizeLevel } from "../src/subjectAliases.js";
import { numericBroadsheet } from "../src/compute.js";
import { getGradingScale } from "../src/repos/config.js";
import { listScoresForClass } from "../src/repos/scores.js";

assertConfig();

async function subjectsForClass(cls) {
  const allSubjects = await SafeDatabase.query("subjects", [], { pageSize: 1000 }).then(r => r.data);
  const levelFilter = normalizeLevel(cls.level);
  let filtered = allSubjects.filter((s) => normalizeLevel(s.level) === levelFilter);
  return mergeCanonicalSubjects(filtered.map((s) => ({ id: s.id, name: s.name, track: s.track || null, level: s.level || null })));
}

async function run() {
  const classId = "P2SWpXEL3F6lImacvkqU"; // JSS 1
  const session = "2025/2026";
  const term = "Third"; // Exact value from frontend query param

  const cls = await SafeDatabase.getById("classes", classId);
  const students = await SafeDatabase.query("students", [["classId", "==", classId]], { pageSize: 100 }).then(r => r.data);
  const subjects = await subjectsForClass(cls);
  const scale = await getGradingScale();
  const scores = await listScoresForClass({ session, term, classId });
  const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
  const sheet = numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

  const st = sheet.students.find(s => s.studentId === "fvs-2026-0029");
  console.log(`Student: ${st.firstName} ${st.lastName}`);
  console.log("Scores keys:", Object.keys(st.scores));
  console.log("Religious Studies Score object:", JSON.stringify(st.scores["FIfbYI2YmfYx3JXoN0cW"], null, 2));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
