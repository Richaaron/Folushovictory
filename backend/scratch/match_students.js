import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const classId = "0FbX2KhjJVropIzuBOEP"; // SSS 1
  const { data: students } = await SafeDatabase.query("students", [["classId", "==", classId]], { pageSize: 100 });
  const irsId = "ilyOfETrDVEW5VjuxvUf";
  
  const matches = students.filter(s => s.subjectIds && s.subjectIds.includes(irsId));
  console.log(`Students in SSS 1 with IRS SSS in subjectIds (${matches.length}):`);
  matches.forEach(s => console.log(`  - ${s.id}: ${s.firstName} ${s.lastName}`));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
