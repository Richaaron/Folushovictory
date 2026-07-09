import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const classId = "P2SWpXEL3F6lImacvkqU"; // JSS 1
  const session = "2025/2026";
  const term = "3rd";

  const { data: scores } = await SafeDatabase.query("scores", [
    ["session", "==", session],
    ["term", "==", term],
    ["classId", "==", classId]
  ], { pageSize: 1000 });

  const irsId = "FIfbYI2YmfYx3JXoN0cW";
  const crsId = "Ac3cReITFXwiTMLHHuyh";

  const irsScores = scores.filter(s => s.subjectId === irsId);
  const crsScores = scores.filter(s => s.subjectId === crsId);

  console.log(`IRS scores entered (${irsScores.length}):`);
  irsScores.forEach(s => {
    if (s.ca1 > 0 || s.ca2 > 0 || s.exam > 0) {
      console.log(`  Student: ${s.studentId} | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam} | EnteredBy: ${s.enteredBy}`);
    }
  });

  console.log(`\nCRS scores entered (${crsScores.length}):`);
  crsScores.forEach(s => {
    if (s.ca1 > 0 || s.ca2 > 0 || s.exam > 0) {
      console.log(`  Student: ${s.studentId} | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam} | EnteredBy: ${s.enteredBy}`);
    }
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
