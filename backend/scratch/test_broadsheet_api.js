import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { mergeCanonicalSubjects, normalizeLevel } from "../src/subjectAliases.js";
import { numericBroadsheet } from "../src/compute.js";
import { getGradingScale } from "../src/repos/config.js";

assertConfig();

async function subjectsForClass(cls) {
  const allSubjects = await SafeDatabase.query("subjects", [], { pageSize: 1000 }).then(r => r.data);
  
  if (Array.isArray(cls.subjectIds) && cls.subjectIds.length) {
    // For class with explicit subjects
    const subs = cls.subjectIds.map(id => allSubjects.find(s => s.id === id)).filter(Boolean);
    return mergeCanonicalSubjects(subs.map(s => ({ id: s.id, name: s.name, track: s.track || null, level: s.level || null })));
  }
  
  const levelFilter = normalizeLevel(cls.level);
  let filtered = allSubjects.filter((s) => normalizeLevel(s.level) === levelFilter);
  if (levelFilter === "SSS" && cls.track) {
    filtered = filtered.filter((s) => s.track === "General" || s.track === cls.track);
  }
  return mergeCanonicalSubjects(filtered.map((s) => ({ id: s.id, name: s.name, track: s.track || null, level: s.level || null })));
}

async function run() {
  // Test SSS 1 broadsheet
  const classId = "0FbX2KhjJVropIzuBOEP";
  const session = "2025/2026";
  const term = "3rd";

  const cls = await SafeDatabase.getById("classes", classId);
  const students = await SafeDatabase.query("students", [["classId", "==", classId]], { pageSize: 100 }).then(r => r.data);
  const subjects = await subjectsForClass(cls);
  const scores = await SafeDatabase.query("scores", [
    ["session", "==", session],
    ["term", "==", term],
    ["classId", "==", classId]
  ], { pageSize: 1000 }).then(r => r.data);
  const scale = await getGradingScale();

  const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
  
  console.log("Subjects (canonical):", subjects.map(s => `${s.name} [${s.id}] aliases: ${JSON.stringify(s.aliasIds)}`));
  
  const sheet = numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

  // Find student with actual scores
  const stWithScores = sheet.students.find(s => {
    const rs = s.scores["SYo7gWINpG0hHj2lIWv1"];
    return rs && rs.total > 0;
  });
  
  if (stWithScores) {
    console.log(`\nStudent with non-zero RS score: ${stWithScores.firstName} ${stWithScores.lastName}`);
    console.log("RS score:", JSON.stringify(stWithScores.scores["SYo7gWINpG0hHj2lIWv1"]));
    console.log("perSubject RS:", JSON.stringify(stWithScores.perSubject?.find(p => p.subjectName === "Religious Studies")));
    console.log("total:", stWithScores.total);
    console.log("average:", stWithScores.average);
    console.log("position:", stWithScores.position);
  } else {
    console.log("\nNo student has non-zero Religious Studies scores in SSS 1!");
    console.log("All students have zero RS:", sheet.students.every(s => !s.scores["SYo7gWINpG0hHj2lIWv1"] || s.scores["SYo7gWINpG0hHj2lIWv1"].total === 0));
    
    // Try to find the student with IRS scores
    const st = sheet.students.find(s => s.studentId === "fvs-2026-0055");
    if (st) {
      console.log("\nfvs-2026-0055 RS score:", JSON.stringify(st.scores["SYo7gWINpG0hHj2lIWv1"]));
    }
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
