import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: scores } = await SafeDatabase.query("scores", [
    ["studentId", "==", "fvs-2026-0029"],
    ["session", "==", "2025/2026"],
    ["term", "==", "3rd"]
  ]);
  
  const { data: subjects } = await SafeDatabase.query("subjects", [], { pageSize: 100 });
  
  console.log("All JSS 1 3rd term scores for fvs-2026-0029:");
  scores.forEach(s => {
    const sub = subjects.find(sub => sub.id === s.subjectId);
    console.log(`  Subject: ${sub?.name || s.subjectId} [ID: ${s.subjectId}] | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam}`);
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
