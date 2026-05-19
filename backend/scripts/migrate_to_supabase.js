import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const firebaseJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!firebaseJson) {
  console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_JSON in .env");
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Initialize Firebase
const serviceAccount = JSON.parse(firebaseJson);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

function getIdColumnName(collectionName) {
  if (collectionName === "students") return "studentId";
  if (collectionName === "users") return "username";
  if (collectionName === "config" || collectionName === "counters") return "key";
  return "id";
}

function mapDocument(collectionName, docId, data) {
  const mapped = { ...data };
  const idCol = getIdColumnName(collectionName);
  
  // Assign primary key column
  mapped[idCol] = docId;

  // Clean and map nested Firestore timestamps
  for (const [key, val] of Object.entries(mapped)) {
    if (val && typeof val === "object" && typeof val.toDate === "function") {
      mapped[key] = val.toDate().toISOString();
    } else if (val && typeof val === "object" && val._seconds !== undefined) {
      mapped[key] = new Date(val._seconds * 1000).toISOString();
    }
  }

  // Ensure JSON fields are formatted correctly
  if (collectionName === "students" && mapped.subjectIds) {
    mapped.subjectIds = Array.isArray(mapped.subjectIds) ? mapped.subjectIds : [];
  }
  if (collectionName === "remarks") {
    mapped.cognitive = mapped.cognitive || {};
    mapped.psychomotor = mapped.psychomotor || {};
    mapped.affective = mapped.affective || {};
  }

  return mapped;
}

async function migrateCollection(collectionName) {
  console.log(`\n--- Migrating collection: "${collectionName}" ---`);
  try {
    const snap = await db.collection(collectionName).get();
    const total = snap.size;
    console.log(`Found ${total} records in Firestore`);

    if (total === 0) {
      console.log(`No records to migrate for "${collectionName}". Skipping.`);
      return;
    }

    const mappedRecords = [];
    snap.forEach((doc) => {
      mappedRecords.push(mapDocument(collectionName, doc.id, doc.data()));
    });

    // Chunk size of 100 to avoid PostgREST payload limits
    const CHUNK_SIZE = 100;
    let successful = 0;

    for (let i = 0; i < mappedRecords.length; i += CHUNK_SIZE) {
      const chunk = mappedRecords.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from(collectionName).upsert(chunk);

      if (error) {
        console.error(`❌ Error migrating batch for "${collectionName}":`, error.message);
        throw error;
      }
      successful += chunk.length;
      console.log(`Progress: ${successful}/${total} migrated successfully.`);
    }

    console.log(`✅ Completed migration for "${collectionName}"!`);
  } catch (err) {
    console.error(`❌ Migration failed for "${collectionName}":`, err.message);
    throw err;
  }
}

async function runMigration() {
  console.log("🚀 STARTING FIRESTORE TO SUPABASE DATA MIGRATION...");

  // Relational order: Parent/Independent tables must migrate before child dependent tables
  const collectionsInOrder = [
    "config",
    "counters",
    "users",
    "classes",
    "subjects",
    "students",
    "assignments",
    "scores",
    "remarks",
    "publishes",
    "releases",
    "activityLogs",
    "logs"
  ];

  try {
    for (const col of collectionsInOrder) {
      await migrateCollection(col);
    }
    console.log("\n⭐️⭐️⭐️ ALL COLLECTIONS MIGRATED SUCCESSFULLY TO SUPABASE! ⭐️⭐️⭐️\n");
  } catch (error) {
    console.error("\n❌ MIGRATION ABORTED DUE TO ERROR:", error.message);
    console.error("Please ensure your Firestore quota is not exhausted before running.");
  }
}

runMigration();
