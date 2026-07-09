import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: scores } = await SafeDatabase.query("scores", [
    ["studentId", "==", "fvs-2026-0029"],
    ["subjectId", "==", "FIfbYI2YmfYx3JXoN0cW"]
  ]);
  console.log("Raw scores for fvs-2026-0029:", JSON.stringify(scores, null, 2));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
