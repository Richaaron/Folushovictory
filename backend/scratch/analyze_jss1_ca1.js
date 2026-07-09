import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: scores } = await SafeDatabase.query("scores", [
    ["classId", "==", "P2SWpXEL3F6lImacvkqU"],
    ["session", "==", "2025/2026"],
    ["term", "==", "3rd"]
  ], { pageSize: 1000 });
  
  console.log(`Total scores in class JSS 1: ${scores.length}`);
  
  // Count how many scores have ca1 = 1, ca1 = 2, etc.
  const ca1Counts = {};
  scores.forEach(s => {
    ca1Counts[s.ca1] = (ca1Counts[s.ca1] || 0) + 1;
  });
  console.log("ca1 value counts in DB:", JSON.stringify(ca1Counts));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
