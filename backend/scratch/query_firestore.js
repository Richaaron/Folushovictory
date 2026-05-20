import admin from "firebase-admin";
import { config } from "../src/config.js";

const serviceAccount = JSON.parse(config.firebaseServiceAccountJson);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function run() {
  console.log("--- Querying Firestore Subjects ---");
  const subjectsSnap = await db.collection("subjects").get();
  console.log(`Found ${subjectsSnap.size} subjects in Firestore:`);
  subjectsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.name} (ID: ${doc.id}, Level: ${data.level}, Track: ${data.track})`);
  });

  console.log("\n--- Querying Firestore Student Aliyu Yahaya ---");
  const studentDoc = await db.collection("students").doc("fvs-2026-0052").get();
  if (studentDoc.exists) {
    console.log("Student in Firestore:", JSON.stringify(studentDoc.data(), null, 2));
  } else {
    console.log("Student not found in Firestore!");
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
