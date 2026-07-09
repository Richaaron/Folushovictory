import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const SSS1_ID = "0FbX2KhjJVropIzuBOEP";
  const SSS2_ID = "0PJLyGRdmN3D1RfswMXl";
  
  const sss1 = await SafeDatabase.getById("classes", SSS1_ID);
  const sss2 = await SafeDatabase.getById("classes", SSS2_ID);
  
  console.log("SSS1 class:", JSON.stringify({ id: sss1.id, name: sss1.name, level: sss1.level }));
  console.log("SSS2 class:", JSON.stringify({ id: sss2.id, name: sss2.name, level: sss2.level }));

  // Check what assignments tch-2026-009 has
  const { data: assignments } = await SafeDatabase.query("assignments", [["teacherUsername", "==", "tch-2026-009"]], { pageSize: 100 });
  console.log(`\nAssignments for tch-2026-009 (${assignments.length}):`);
  for (const a of assignments) {
    const cls = await SafeDatabase.getById("classes", a.classId).catch(() => null);
    const { data: subjects } = await SafeDatabase.query("subjects", [], { pageSize: 1000 });
    const sub = subjects.find(s => s.id === a.subjectId);
    console.log(`  Class: ${cls?.name} (${a.classId}) | Subject: ${sub?.name || a.subjectId}`);
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
