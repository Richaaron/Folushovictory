import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function addMissingSubjects() {
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  const db = admin.firestore();
  
  // Subjects to add
  const MISSING_SUBJECTS = [
    { name: "Agricultural Science", level: "PRIMARY" }
  ];
  
  try {
    console.log("Adding missing subjects...");
    const batch = db.batch();
    
    for (const { name, level } of MISSING_SUBJECTS) {
      const newId = db.collection("subjects").doc().id;
      batch.set(db.collection("subjects").doc(newId), {
        name,
        level,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✓ Created: ${name} (${level})`);
    }
    
    await batch.commit();
    console.log("\n✓ Done!");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addMissingSubjects().then(() => {
  process.exit(0);
});
