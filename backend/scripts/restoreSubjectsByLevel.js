import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function restoreSubjectsByLevel() {
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  const db = admin.firestore();
  
  // Define subjects that should exist at each level
  const SUBJECTS_BY_LEVEL = {
    PRIMARY: [
      "Mathematics", "English Language", "Basic Science", "Basic Technology", 
      "National Values", "Agricultural Science", "Physical & Health Education", 
      "Home Economics", "Computer Studies", "Religious Studies", "Phonics",
      "Vocational Aptitude", "Quantitative Reasoning", "Verbal Reasoning",
      "Literature", "Creative Arts", "Writing"
    ],
    JSS: [
      "Mathematics", "English Language", "Intermidiate Science", 
      "National Values", "Livestock Studies", "Physical & Health Education", 
      "Home Economics", "Digital Technology", "Religious Studies",
      "Business Studies", "Hausa", "Fine Arts"
    ],
    SSS: [
      "Mathematics", "English Language", "Intermidiate Science",
      "National Values", "Livestock Studies", "Physical & Health Education", 
      "Home Economics", "Digital Technology", "Religious Studies",
      "Biology", "Citizenship and Heritage studies", "Geography", "Chemistry", "Physics",
      "Government", "Literature in English", "Accounting", "Commerce"
    ]
  };
  
  try {
    console.log("Fetching current subjects...");
    const subjectSnap = await db.collection("subjects").get();
    const currentSubjects = subjectSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Create map of (name, level) -> id
    const existing = new Map();
    currentSubjects.forEach(s => {
      const key = `${s.name || ""}|${s.level || ""}`;
      existing.set(key, s.id);
    });
    
    console.log(`Current subjects: ${currentSubjects.length}`);
    console.log(`Existing (name, level) combinations: ${existing.size}\n`);
    
    // Check what's missing
    const toCreate = [];
    for (const [level, subjectNames] of Object.entries(SUBJECTS_BY_LEVEL)) {
      for (const name of subjectNames) {
        const key = `${name}|${level}`;
        if (!existing.has(key)) {
          toCreate.push({ name, level });
        }
      }
    }
    
    console.log(`Missing subjects: ${toCreate.length}`);
    toCreate.forEach(s => {
      console.log(`  - ${s.name} (${s.level})`);
    });
    
    if (toCreate.length === 0) {
      console.log("\n✓ All required subjects exist!");
      return;
    }
    
    // Create missing subjects
    console.log(`\nCreating ${toCreate.length} missing subjects...`);
    const batch = db.batch();
    let created = 0;
    
    for (const { name, level } of toCreate) {
      const newId = db.collection("subjects").doc().id;
      batch.set(db.collection("subjects").doc(newId), {
        name,
        level,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      created++;
      console.log(`  ✓ ${name} (${level})`);
    }
    
    await batch.commit();
    console.log(`\n✓ Created ${created} subjects`);
    
  } catch (error) {
    console.error("Error restoring subjects:", error);
    process.exit(1);
  }
}

restoreSubjectsByLevel().then(() => {
  console.log("\nRestoration complete!");
  process.exit(0);
});
