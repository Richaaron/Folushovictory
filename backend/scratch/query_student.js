import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

console.log("--- Querying All Aliyu / Yahaya Students ---");
const { data: students } = await SafeDatabase.query("students", [], { pageSize: 5000 });
const matches = students.filter(s => 
  (s.firstName || "").toLowerCase().includes("aliyu") || 
  (s.lastName || "").toLowerCase().includes("yahaya")
);

console.log(`Found ${matches.length} matches:`);
for (const s of matches) {
  console.log(JSON.stringify(s, null, 2));
}

process.exit(0);
