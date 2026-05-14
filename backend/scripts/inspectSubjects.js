import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function inspectSubjectStructure() {
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  const db = admin.firestore();
  
  try {
    console.log("Current Subject Structure:\n");
    const subjectSnap = await db.collection("subjects").get();
    const subjects = subjectSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Group by name
    const byName = new Map();
    subjects.forEach(s => {
      const name = s.name || "Unknown";
      if (!byName.has(name)) {
        byName.set(name, []);
      }
      byName.get(name).push(s);
    });
    
    // Sort and display
    const sorted = Array.from(byName.entries()).sort();
    sorted.forEach(([name, items]) => {
      console.log(`${name}:`);
      items.forEach(item => {
        console.log(`  - ${item.level || 'No Level'}: ${item.id}`);
      });
    });
    
    console.log(`\n\nTotal: ${subjects.length} subjects across ${byName.size} subject names`);
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

inspectSubjectStructure().then(() => {
  process.exit(0);
});
