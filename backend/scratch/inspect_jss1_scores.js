import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const classId = "P2SWpXEL3F6lImacvkqU"; // JSS 1
  const session = "2025/2026";
  const term = "3rd";

  const scores = await SafeDatabase.query("scores", [
    ["session", "==", session],
    ["term", "==", term],
    ["classId", "==", classId],
    ["subjectId", "==", "FIfbYI2YmfYx3JXoN0cW"]
  ], { pageSize: 1000 }).then(r => r.data);

  console.log(`Total IRS JSS scores: ${scores.length}`);
  const nonZero = scores.filter(s => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0);
  console.log(`Non-zero IRS JSS scores: ${nonZero.length}`);
  nonZero.slice(0, 5).forEach(s => {
    console.log(`Student: ${s.studentId} | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam}`);
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
