// Test the broadsheet flow with term="Third" (as sent from frontend)
import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { mergeCanonicalSubjects, normalizeLevel } from "../src/subjectAliases.js";
import { numericBroadsheet } from "../src/compute.js";
import { getGradingScale } from "../src/repos/config.js";
import { listScoresForClass } from "../src/repos/scores.js";

assertConfig();

async function run() {
  const classId = "P2SWpXEL3F6lImacvkqU"; // JSS 1
  const session = "2025/2026";
  const termFromUrl = "Third";  // This is what comes from the URL query param

  const cls = await SafeDatabase.getById("classes", classId);
  const students = await SafeDatabase.query("students", [["classId", "==", classId]], { pageSize: 100 }).then(r => r.data);
  const allSubjects = await SafeDatabase.query("subjects", [], { pageSize: 1000 }).then(r => r.data);
  const scale = await getGradingScale();

  // Build subjects
  const levelFilter = normalizeLevel(cls.level);
  let filtered = allSubjects.filter((s) => normalizeLevel(s.level) === levelFilter);
  const subjects = mergeCanonicalSubjects(filtered.map((s) => ({ id: s.id, name: s.name, track: s.track || null, level: s.level || null })));

  // Fetch scores with the term as it comes from the URL
  const scores = await listScoresForClass({ session, term: termFromUrl, classId });
  
  console.log(`Scores fetched with term="${termFromUrl}": ${scores.length}`);
  
  const irsScores = scores.filter(s => s.subjectId === "FIfbYI2YmfYx3JXoN0cW");
  const nonZeroIRS = irsScores.filter(s => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0);
  console.log(`IRS JSS scores: ${irsScores.length}, non-zero: ${nonZeroIRS.length}`);
  nonZeroIRS.forEach(s => console.log(`  Student: ${s.studentId} | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam}`));

  const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
  const sheet = numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

  // Check the two students with non-zero scores
  ["fvs-2026-0006", "fvs-2026-0029"].forEach(stId => {
    const st = sheet.students.find(s => s.studentId === stId);
    if (st) {
      const rsScore = st.scores["FIfbYI2YmfYx3JXoN0cW"];
      console.log(`\n${stId}: RS total=${rsScore?.total}, ca1=${rsScore?.ca1}, ca2=${rsScore?.ca2}, exam=${rsScore?.exam}`);
    } else {
      console.log(`\n${stId}: NOT FOUND in broadsheet`);
    }
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
