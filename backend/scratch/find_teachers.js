import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: users } = await SafeDatabase.query("users", [], { pageSize: 1000 });
  const maimuna = users.find(u => String(u.displayName).toLowerCase().includes("maimuna") || String(u.username).toLowerCase().includes("maimuna"));
  const patricia = users.find(u => String(u.displayName).toLowerCase().includes("patricia") || String(u.username).toLowerCase().includes("patricia"));

  console.log("Maimuna User:", JSON.stringify(maimuna, null, 2));
  console.log("Patricia User:", JSON.stringify(patricia, null, 2));

  if (maimuna) {
    const { data: assignments } = await SafeDatabase.query("assignments", [["teacherUsername", "==", maimuna.username]], { pageSize: 100 });
    console.log(`\nMaimuna (${maimuna.username}) Assignments:`);
    for (const a of assignments) {
      const cls = await SafeDatabase.getById("classes", a.classId).catch(() => null);
      const sub = await SafeDatabase.getById("subjects", a.subjectId).catch(() => null);
      console.log(`  Class: ${cls?.name || a.classId} (${a.classId}) | Subject: ${sub?.name || a.subjectId} (${a.subjectId})`);
    }
  }

  if (patricia) {
    const { data: assignments } = await SafeDatabase.query("assignments", [["teacherUsername", "==", patricia.username]], { pageSize: 100 });
    console.log(`\nPatricia (${patricia.username}) Assignments:`);
    for (const a of assignments) {
      const cls = await SafeDatabase.getById("classes", a.classId).catch(() => null);
      const sub = await SafeDatabase.getById("subjects", a.subjectId).catch(() => null);
      console.log(`  Class: ${cls?.name || a.classId} (${a.classId}) | Subject: ${sub?.name || a.subjectId} (${a.subjectId})`);
    }
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
