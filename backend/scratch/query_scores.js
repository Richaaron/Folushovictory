import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  console.log("--- Querying Scores for Aliyu Yahaya (fvs-2026-0052) ---");
  const { data: scores } = await SafeDatabase.query("scores", [["studentId", "==", "fvs-2026-0052"]], { pageSize: 1000 });
  console.log(`Found ${scores.length} scores:`);
  for (const s of scores) {
    const sub = await SafeDatabase.getById("subjects", s.subjectId).catch(() => ({ name: "Unknown" }));
    console.log(`- Subject: ${sub.name} (ID: ${s.subjectId}), CA1: ${s.ca1}, CA2: ${s.ca2}, Exam: ${s.exam}`);
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
