import admin from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
// Fix for escaped newlines in private key from .env string
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const GRADING_SCALE = {
  grades: [
    { letter: "A", min: 70, max: 100, remark: "Distinction" },
    { letter: "B", min: 60, max: 69, remark: "Very Good" },
    { letter: "C", min: 50, max: 59, remark: "Credit" },
    { letter: "D", min: 45, max: 49, remark: "Pass" },
    { letter: "F", min: 0, max: 44, remark: "Fail" },
  ]
};

const SUBJECTS = [
  // Primary & Secondary Core
  { id: "math", name: "Mathematics" },
  { id: "eng", name: "English Language" },
  { id: "sci", name: "Basic Science" },
  { id: "tech", name: "Basic Technology" },
  { id: "nv", name: "National Values" },
  { id: "agric", name: "Agriculture Science" },
  { id: "phe", name: "Physical & Health Education" },
  { id: "home-ec", name: "Home Economics" },
  { id: "comp", name: "Computer Studies" },
  { id: "crs", name: "Religious Studies" },
  
  // Primary Specific
  { id: "phonics", name: "Phonics" },
  { id: "voc-apt", name: "Vocational Aptitude" },
  { id: "quant-re", name: "Quantitative Reasoning" },
  { id: "verb-re", name: "Verbal Reasoning" },
  { id: "lit-p", name: "Literature" },
  { id: "art-p", name: "Creative Arts" },
  { id: "writing", name: "Writing" },
  
  // JSS Specific
  { id: "bus", name: "Business Studies" },
  { id: "hausa", name: "Hausa" },
  { id: "art-j", name: "Fine Arts" },
  
  // SSS Core
  { id: "bio", name: "Biology" },
  { id: "marketing", name: "Marketing" },
  { id: "civic", name: "Civic Education" },
  { id: "geo", name: "Geography" },
  
  // SSS Tracks
  { id: "chem", name: "Chemistry" },
  { id: "phys", name: "Physics" },
  { id: "gov", name: "Government" },
  { id: "lit-s", name: "Literature in English" },
  { id: "acc", name: "Accounting" },
  { id: "comm", name: "Commerce" },
];

async function seed() {
  console.log("🌱 Seeding School Data...");

  // 1. Seed Grading Scale
  await db.collection("config").doc("gradingScale").set({
    ...GRADING_SCALE,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log("✅ Grading scale seeded.");

  // 2. Seed Subjects
  const subjectsCol = db.collection("subjects");
  for (const sub of SUBJECTS) {
    await subjectsCol.doc(sub.id).set({
      ...sub,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  console.log(`✅ ${SUBJECTS.length} subjects seeded/updated.`);

  // 3. Seed Initial School Settings
  await db.collection("config").doc("schoolSettings").set({
    name: "Folusho Victory Schools",
    motto: "Fountain of Knowledge",
    address: "Barnawa Kaduna South, Kaduna State",
    phone: "+234 800 000 0000",
    email: "folushovictoryschool@gmail.com",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log("✅ School settings seeded.");

  console.log("🏁 Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
