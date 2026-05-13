import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cleanupDuplicateAssignments() {
  // Initialize Firebase with service account
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  const db = admin.firestore();
  
  try {
    // Get all assignments
    const snap = await db.collection("assignments").get();
    const assignments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`Total assignments in database: ${assignments.length}\n`);
    console.log("All assignments:");
    assignments.forEach((a, idx) => {
      console.log(`  [${idx + 1}] Teacher: ${a.teacherUsername}, Class: ${a.classId}, Subject: ${a.subjectId}, ID: ${a.id}`);
    });
    
    // Group by teacherUsername-classId-subjectId
    const grouped = new Map();
    assignments.forEach(a => {
      const key = `${a.teacherUsername || ''}-${a.classId}-${a.subjectId}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(a);
    });
    
    console.log(`\n\nGrouped by teacher-class-subject (${grouped.size} unique combinations):`);
    
    // Find duplicates
    const duplicates = [];
    grouped.forEach((items, key) => {
      if (items.length > 1) {
        console.log(`\nFound ${items.length} assignments for: ${key}`);
        items.forEach((item, idx) => {
          console.log(`  [${idx + 1}] ID: ${item.id}`);
        });
        // Keep the first one, mark others for deletion
        for (let i = 1; i < items.length; i++) {
          duplicates.push(items[i].id);
        }
      }
    });
    
    if (duplicates.length === 0) {
      console.log("\nNo duplicate assignments found!");
      return;
    }
    
    console.log(`\n\nFound ${duplicates.length} duplicate assignment(s) to delete:`);
    duplicates.forEach(id => console.log(`  - ${id}`));
    
    // Delete duplicates
    console.log(`\nDeleting ${duplicates.length} duplicate assignment(s)...`);
    const batch = db.batch();
    duplicates.forEach(id => {
      batch.delete(db.collection("assignments").doc(id));
    });
    await batch.commit();
    
    console.log(`✓ Successfully deleted ${duplicates.length} duplicate assignment(s)`);
    
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    process.exit(1);
  }
}

cleanupDuplicateAssignments().then(() => {
  console.log("\nCleanup complete!");
  process.exit(0);
});
