import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  // Check ALL scores entered by tch-2026-009
  console.log("=== All scores entered by tch-2026-009 ===");
  const { data: scores } = await SafeDatabase.query(
    "scores",
    [["enteredBy", "==", "tch-2026-009"]],
    { pageSize: 500 }
  );
  
  console.log(`Total scores entered: ${scores.length}`);
  
  if (scores.length === 0) {
    console.log("NO scores have been entered by this teacher at all!");
    console.log("\nThis means the teacher has never successfully saved scores.");
    console.log("The error might be happening silently on the frontend.");
  } else {
    const { data: allSubjects } = await SafeDatabase.query("subjects", [], { pageSize: 1000 });
    const { data: allClasses } = await SafeDatabase.query("classes", [], { pageSize: 100 });
    
    const grouped = {};
    for (const s of scores) {
      const key = `${s.classId}_${s.subjectId}_${s.session}_${s.term}`;
      if (!grouped[key]) {
        const sub = allSubjects.find(x => x.id === s.subjectId);
        const cls = allClasses.find(x => x.id === s.classId);
        grouped[key] = { className: cls?.name, subjectName: sub?.name, session: s.session, term: s.term, count: 0 };
      }
      grouped[key].count++;
    }
    
    for (const [key, info] of Object.entries(grouped)) {
      console.log(`  Class: ${info.className} | Subject: ${info.subjectName} | ${info.session} ${info.term} | ${info.count} students`);
    }
  }
  
  // Also check for any IRS SSS scores across all classes
  console.log("\n=== Any IRS SSS scores across entire DB ===");
  const { data: irsScores } = await SafeDatabase.query(
    "scores",
    [["subjectId", "==", "ilyOfETrDVEW5VjuxvUf"]],
    { pageSize: 200 }
  );
  console.log(`IRS SSS scores: ${irsScores.length}`);
  
  const { data: crsScores } = await SafeDatabase.query(
    "scores",
    [["subjectId", "==", "SYo7gWINpG0hHj2lIWv1"]],
    { pageSize: 200 }
  );
  console.log(`CRS SSS scores: ${crsScores.length}`);
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
