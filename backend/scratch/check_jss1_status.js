import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const classId = "P2SWpXEL3F6lImacvkqU"; // JSS 1
  const session = "2025/2026";
  const term = "3rd";

  // 1. Check if JSS 1 is published
  const { data: publishes } = await SafeDatabase.query("publishes", [
    ["classId", "==", classId],
    ["session", "==", session]
  ], { pageSize: 20 });
  console.log(`JSS 1 publish records (${publishes.length}):`);
  publishes.forEach(p => console.log(`  term: ${p.term} | published: ${p.published} | id: ${p.id}`));
  
  // 2. Check scores for tch-2026-009 in JSS 1 this term
  const { data: scores } = await SafeDatabase.query("scores", [
    ["classId", "==", classId],
    ["session", "==", session],
    ["term", "==", term],
    ["subjectId", "==", "FIfbYI2YmfYx3JXoN0cW"] // IRS JSS
  ], { pageSize: 100 });
  
  const nonZero = scores.filter(s => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0);
  console.log(`\nJSS 1 IRS JSS scores for 3rd term: ${scores.length} total, ${nonZero.length} non-zero`);
  nonZero.forEach(s => console.log(`  Student: ${s.studentId} | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam} | By: ${s.enteredBy}`));
  
  // 3. Check most recent activity logs for saves
  const { data: logs } = await SafeDatabase.query("activityLogs", [["actor", "==", "tch-2026-009"]], { pageSize: 50 });
  const scoreLogs = logs.filter(l => l.action === "Entered numeric scores").slice(0, 5);
  console.log(`\nMost recent save attempts by tch-2026-009:`);
  scoreLogs.forEach(l => console.log(`  ${l.createdAt} | class: ${l.details?.classId} | subject: ${l.details?.subjectId} | records: ${l.details?.recordCount}`));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
