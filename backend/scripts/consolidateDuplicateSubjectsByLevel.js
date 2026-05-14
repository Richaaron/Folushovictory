import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function consolidateDuplicateSubjectsByLevelAndName() {
  // Initialize Firebase with service account
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  const db = admin.firestore();
  
  try {
    console.log("Fetching all subjects...");
    const subjectSnap = await db.collection("subjects").get();
    const subjects = subjectSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`Total subjects in database: ${subjects.length}\n`);
    
    // Group subjects by (name, level) pair - only consolidate within same level
    const grouped = new Map();
    subjects.forEach(s => {
      const name = (s.name || "").trim();
      const level = (s.level || "Unknown").trim();
      const key = `${name}|${level}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(s);
    });
    
    // Find duplicates only within same level
    const duplicates = [];
    grouped.forEach((items, key) => {
      if (items.length > 1) {
        const [name, level] = key.split("|");
        console.log(`\nFound ${items.length} subjects: "${name}" (${level})`);
        items.forEach((item, idx) => {
          console.log(`  [${idx + 1}] ID: ${item.id}`);
        });
        duplicates.push({ name, level, items, key });
      }
    });
    
    if (duplicates.length === 0) {
      console.log("\n✓ No duplicate subject entries found (same name + level)!");
      return;
    }
    
    console.log(`\n\nFound ${duplicates.length} subject(s) with duplicate entries`);
    
    // For each duplicate, keep the first one and redirect assignments to it
    const batch = db.batch();
    let reassignmentCount = 0;
    let deletedCount = 0;
    
    for (const { name, level, items } of duplicates) {
      const keepId = items[0].id; // Keep first one
      const deleteIds = items.slice(1).map(i => i.id);
      
      console.log(`\nConsolidating "${name}" (${level}):`);
      console.log(`  → Keeping: ${keepId}`);
      console.log(`  → Deleting: ${deleteIds.join(', ')}`);
      
      // Find all assignments pointing to the duplicate subjects
      for (const deleteId of deleteIds) {
        const assignSnap = await db.collection("assignments")
          .where("subjectId", "==", deleteId)
          .get();
        
        console.log(`    - Found ${assignSnap.size} assignment(s) pointing to ${deleteId}`);
        
        // Update assignments to point to the kept subject
        assignSnap.docs.forEach(doc => {
          batch.update(doc.ref, { subjectId: keepId });
          reassignmentCount++;
        });
        
        // Delete the duplicate subject
        batch.delete(db.collection("subjects").doc(deleteId));
        deletedCount++;
      }
    }
    
    console.log(`\n\nApplying changes:`);
    console.log(`  - Reassigning ${reassignmentCount} assignment(s) to consolidated subjects`);
    console.log(`  - Deleting ${deletedCount} duplicate subject(s)`);
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log("\n✓ Successfully consolidated duplicate subjects!");
    }
    
  } catch (error) {
    console.error("Error consolidating subjects:", error);
    process.exit(1);
  }
}

consolidateDuplicateSubjectsByLevelAndName().then(() => {
  console.log("\nConsolidation complete!");
  process.exit(0);
});
