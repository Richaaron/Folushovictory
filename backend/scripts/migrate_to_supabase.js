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
let parsed = JSON.parse(firebaseJson.trim());
// Handle potential double-quoting in .env
if (typeof parsed === "string") {
  parsed = JSON.parse(parsed);
}
const cert = {
  ...parsed,
  private_key: parsed.private_key ? parsed.private_key.replace(/\\n/g, "\n") : undefined
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(cert)
  });
}
const db = admin.firestore();

function getIdColumnName(collectionName) {
  if (collectionName === "students") return "studentId";
  if (collectionName === "users") return "username";
  if (collectionName === "config" || collectionName === "counters") return "key";
  return "id";
}

function parseTimestamp(val) {
  if (val && typeof val === "object" && typeof val.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (val && typeof val === "object" && val._seconds !== undefined) {
    return new Date(val._seconds * 1000).toISOString();
  }
  if (typeof val === "string" || val instanceof Date) {
    try {
      return new Date(val).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  }
  return new Date().toISOString();
}

const TABLE_COLUMNS = {
  users: [
    "username", "role", "email", "firstName", "lastName",
    "passwordHash", "portal", "displayName", "studentId",
    "createdAt", "updatedAt"
  ],
  classes: [
    "id", "name", "level", "formTeacherUsername", "createdAt", "updatedAt"
  ],
  students: [
    "studentId", "firstName", "lastName", "classId", "email",
    "phone", "stream", "subjectIds", "createdAt", "updatedAt"
  ],
  subjects: [
    "id", "name", "level", "category", "stream", "track", "createdAt", "updatedAt"
  ],
  assignments: [
    "id", "teacherUsername", "classId", "subjectId", "createdAt", "updatedAt"
  ],
  scores: [
    "id", "session", "term", "classId", "studentId", "subjectId",
    "type", "ca1", "ca2", "ca", "exam", "rating", "enteredBy", "createdAt", "updatedAt"
  ],
  remarks: [
    "id", "studentId", "classId", "session", "term", "principalRemarks",
    "teacherRemarks", "principalName", "teacherName", "attendance",
    "maxAttendance", "cognitive", "psychomotor", "affective", "createdAt", "updatedAt"
  ],
  publishes: [
    "id", "classId", "session", "term", "published", "createdAt", "updatedAt"
  ],
  releases: [
    "id", "classId", "session", "term", "released", "createdAt", "updatedAt"
  ],
  config: [
    "key", "value", "createdAt", "updatedAt"
  ],
  counters: [
    "key", "value", "createdAt", "updatedAt"
  ],
  activityLogs: [
    "id", "actor", "role", "action", "details", "resourceType", "resourceId", "createdAt", "updatedAt"
  ],
  logs: [
    "id", "to", "subject", "type", "status", "messageId", "error", "createdAt", "updatedAt"
  ]
};

const migratedUsernames = new Set();
const migratedClassIds = new Set();
const migratedSubjectIds = new Set();
const migratedStudentIds = new Set();

function mapDocument(collectionName, docId, data) {
  if (collectionName === "config") {
    const cleanValue = { ...data };
    for (const [k, v] of Object.entries(cleanValue)) {
      if (v && typeof v === "object" && (typeof v.toDate === "function" || v._seconds !== undefined)) {
        cleanValue[k] = parseTimestamp(v);
      }
    }
    return {
      key: docId,
      value: cleanValue,
      createdAt: parseTimestamp(data.createdAt),
      updatedAt: parseTimestamp(data.updatedAt)
    };
  }

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

  // Handle case-sensitivity and relational constraints
  if (collectionName === "users") {
    // Use the `username` field value as PK (not doc ID), since some docs
    // have auto-generated Firestore IDs that differ from their username field
    const username = (data.username || docId).toLowerCase().trim();
    mapped.username = username;
    migratedUsernames.add(username);
  }

  if (collectionName === "classes") {
    const classId = docId.trim();
    mapped.id = classId;
    if (mapped.formTeacherUsername) {
      mapped.formTeacherUsername = mapped.formTeacherUsername.toLowerCase().trim();
    }
    migratedClassIds.add(classId);
  }

  if (collectionName === "subjects") {
    const subjectId = docId.trim();
    mapped.id = subjectId;
    migratedSubjectIds.add(subjectId);
  }

  if (collectionName === "students") {
    const studentId = docId.toLowerCase().trim();
    mapped.studentId = studentId;
    const classId = (mapped.classId || "").trim();
    mapped.classId = classId;

    if (!classId || !migratedClassIds.has(classId)) {
      console.warn(`⚠️ Skipping student "${studentId}": classId "${classId}" not found in migrated classes.`);
      return null;
    }
    migratedStudentIds.add(studentId);
  }

  if (collectionName === "assignments") {
    const teacherUsername = (mapped.teacherUsername || "").toLowerCase().trim();
    mapped.teacherUsername = teacherUsername;
    const classId = (mapped.classId || "").trim();
    mapped.classId = classId;
    const subjectId = (mapped.subjectId || "").trim();
    mapped.subjectId = subjectId;

    if (!teacherUsername || !migratedUsernames.has(teacherUsername)) {
      console.warn(`⚠️ Skipping assignment "${docId}": teacherUsername "${teacherUsername}" not found in migrated users.`);
      return null;
    }
    if (!classId || !migratedClassIds.has(classId)) {
      console.warn(`⚠️ Skipping assignment "${docId}": classId "${classId}" not found in migrated classes.`);
      return null;
    }
    if (!subjectId || !migratedSubjectIds.has(subjectId)) {
      console.warn(`⚠️ Skipping assignment "${docId}": subjectId "${subjectId}" not found in migrated subjects.`);
      return null;
    }
  }

  if (collectionName === "scores") {
    const studentId = (mapped.studentId || "").toLowerCase().trim();
    mapped.studentId = studentId;
    const classId = (mapped.classId || "").trim();
    mapped.classId = classId;
    const subjectId = (mapped.subjectId || "").trim();
    mapped.subjectId = subjectId;

    if (!studentId || !migratedStudentIds.has(studentId)) {
      console.warn(`⚠️ Skipping score "${docId}": studentId "${studentId}" not found in migrated students.`);
      return null;
    }
    if (!classId || !migratedClassIds.has(classId)) {
      console.warn(`⚠️ Skipping score "${docId}": classId "${classId}" not found in migrated classes.`);
      return null;
    }
    if (!subjectId || !migratedSubjectIds.has(subjectId)) {
      console.warn(`⚠️ Skipping score "${docId}": subjectId "${subjectId}" not found in migrated subjects.`);
      return null;
    }
  }

  if (collectionName === "remarks") {
    const studentId = (mapped.studentId || "").toLowerCase().trim();
    mapped.studentId = studentId;
    const classId = (mapped.classId || "").trim();
    mapped.classId = classId;

    if (!studentId || !migratedStudentIds.has(studentId)) {
      console.warn(`⚠️ Skipping remark "${docId}": studentId "${studentId}" not found in migrated students.`);
      return null;
    }
    if (!classId || !migratedClassIds.has(classId)) {
      console.warn(`⚠️ Skipping remark "${docId}": classId "${classId}" not found in migrated classes.`);
      return null;
    }
  }

  if (collectionName === "publishes") {
    const classId = (mapped.classId || "").trim();
    mapped.classId = classId;
    if (!classId || !migratedClassIds.has(classId)) {
      console.warn(`⚠️ Skipping publish "${docId}": classId "${classId}" not found in migrated classes.`);
      return null;
    }
  }

  if (collectionName === "releases") {
    const classId = (mapped.classId || "").trim();
    mapped.classId = classId;
    if (!classId || !migratedClassIds.has(classId)) {
      console.warn(`⚠️ Skipping release "${docId}": classId "${classId}" not found in migrated classes.`);
      return null;
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

  // Filter with whitelist schema columns to avoid Postgres insert errors
  const columns = TABLE_COLUMNS[collectionName];
  if (columns) {
    const cleaned = {};
    for (const col of columns) {
      if (mapped[col] !== undefined) {
        cleaned[col] = mapped[col];
      }
    }
    return cleaned;
  }

  return mapped;
}

async function prePopulateMigratedSets() {
  console.log("📥 Pre-populating migrated ID sets from Supabase...");
  
  // users
  const { data: users, error: errUsers } = await supabase.from("users").select("username");
  if (!errUsers && users) {
    users.forEach(u => migratedUsernames.add(u.username.toLowerCase().trim()));
  }
  
  // classes
  const { data: classes, error: errClasses } = await supabase.from("classes").select("id");
  if (!errClasses && classes) {
    classes.forEach(c => migratedClassIds.add(c.id.trim()));
  }
  
  // subjects
  const { data: subjects, error: errSubjects } = await supabase.from("subjects").select("id");
  if (!errSubjects && subjects) {
    subjects.forEach(s => migratedSubjectIds.add(s.id.trim()));
  }
  
  // students
  const { data: students, error: errStudents } = await supabase.from("students").select("studentId");
  if (!errStudents && students) {
    students.forEach(st => migratedStudentIds.add(st.studentId.toLowerCase().trim()));
  }
  
  console.log(`Loaded existing sets: ${migratedUsernames.size} users, ${migratedClassIds.size} classes, ${migratedSubjectIds.size} subjects, ${migratedStudentIds.size} students.`);
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
      const mapped = mapDocument(collectionName, doc.id, doc.data());
      if (mapped !== null) {
        mappedRecords.push(mapped);
      }
    });

    console.log(`Filtered down to ${mappedRecords.length}/${total} valid records to upsert.`);

    if (mappedRecords.length === 0) {
      console.log(`No valid records to migrate for "${collectionName}". Skipping.`);
      return;
    }

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
      console.log(`Progress: ${successful}/${mappedRecords.length} migrated successfully.`);
    }

    console.log(`✅ Completed migration for "${collectionName}"!`);
  } catch (err) {
    console.error(`❌ Migration failed for "${collectionName}":`, err.message);
    throw err;
  }
}

async function runMigration() {
  console.log("🚀 STARTING FIRESTORE TO SUPABASE DATA MIGRATION...");

  // Load existing records first
  await prePopulateMigratedSets();

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
  }
}

runMigration();

