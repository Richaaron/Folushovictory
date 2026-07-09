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
  const levelFilter = normalizeLevel(cls.level);
  let filtered = allSubjects.filter((s) => normalizeLevel(s.level) === levelFilter);
  subjects = mergeCanonicalSubjects(filtered.map((s) => ({ id: s.id, name: s.name, track: s.track || null, level: s.level || null })));

  const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
  const sheet = numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

  console.log("Religious Studies Broadsheet Scores for JSS 1:");
  sheet.students.forEach(st => {
    const score = st.scores["FIfbYI2YmfYx3JXoN0cW"] || st.scores["Ac3cReITFXwiTMLHHuyh"];
    console.log(`Student: ${st.firstName} ${st.lastName} (${st.studentId})`);
    console.log(`  Computed Score: CA1: ${score?.ca1} | CA2: ${score?.ca2} | Exam: ${score?.exam} | Total: ${score?.total}`);
    
    // Check raw scores in DB
    const irs = scores.find(s => s.studentId === st.studentId && s.subjectId === "FIfbYI2YmfYx3JXoN0cW");
    const crs = scores.find(s => s.studentId === st.studentId && s.subjectId === "Ac3cReITFXwiTMLHHuyh");
    console.log(`  Raw IRS in DB: CA1: ${irs?.ca1} | CA2: ${irs?.ca2} | Exam: ${irs?.exam} | EnteredBy: ${irs?.enteredBy}`);
    console.log(`  Raw CRS in DB: CA1: ${crs?.ca1} | CA2: ${crs?.ca2} | Exam: ${crs?.exam} | EnteredBy: ${crs?.enteredBy}`);
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
