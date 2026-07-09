import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: classes } = await SafeDatabase.query("classes", [["name", "==", "SSS 2"]]);
  const cls = classes[0];
  const { data: students } = await SafeDatabase.query("students", [["classId", "==", cls.id]], { pageSize: 100 });
  console.log(`SSS 2 Class ID: ${cls.id}`);
  console.log(`Number of students in SSS 2: ${students.length}`);
  console.log("Students streams and subjects:");
  students.forEach(s => {
    console.log(`  Name: ${s.firstName} ${s.lastName} | Stream: ${s.stream} | SubjectIds: ${JSON.stringify(s.subjectIds)}`);
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
