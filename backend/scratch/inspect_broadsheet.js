import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { mergeCanonicalSubjects, normalizeLevel } from "../src/subjectAliases.js";
import { numericBroadsheet } from "../src/compute.js";
import { getGradingScale } from "../src/repos/config.js";

assertConfig();

async function run() {
  const classId = "0FbX2KhjJVropIzuBOEP"; // SSS 1
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

  console.log(`Class: ${cls.name} | level: ${cls.level} | track: ${cls.track}`);
  console.log(`Total students: ${students.length}`);
  console.log(`Total scores in class: ${scores.length}`);
  
  // Find IRS SSS scores in the scores list
  const irsScores = scores.filter(s => s.subjectId === "ilyOfETrDVEW5VjuxvUf");
  console.log(`IRS SSS scores in database: ${irsScores.length}`);
  irsScores.forEach(s => {
    console.log(`  Student: ${s.studentId} | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam} | Total: ${s.ca}`);
  });

  // Calculate subjects for this class
  let subjects;
  if (Array.isArray(cls.subjectIds) && cls.subjectIds.length) {
    // ...
  } else {
    const levelFilter = normalizeLevel(cls.level);
    let filtered = allSubjects.filter((s) => normalizeLevel(s.level) === levelFilter);
    if (levelFilter === "SSS" && cls.track) {
      filtered = filtered.filter((s) => s.track === "General" || s.track === cls.track);
    }
    subjects = mergeCanonicalSubjects(filtered.map((s) => ({ id: s.id, name: s.name, track: s.track || null, level: s.level || null })));
  }

  console.log("\nSubjects for broadsheet:");
  subjects.forEach(s => {
    console.log(`  Name: ${s.name} | ID: ${s.id} | Alias IDs: ${JSON.stringify(s.aliasIds)}`);
  });

  const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
  const sheet = numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

  console.log("\nBroadsheet rows (sample 2):");
  sheet.students.slice(0, 2).forEach(st => {
    console.log(`Student: ${st.firstName} ${st.lastName}`);
    console.log(`  Scores keys: ${Object.keys(st.scores)}`);
    console.log(`  Scores values:`, JSON.stringify(st.scores));
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
