import { assertConfig } from "../src/config.js";
import { getFirebaseApp, getDb } from "../src/firebase.js";

assertConfig();
getFirebaseApp();

const classes = [
  { name: "JSS 1", level: "JSS 1", assessmentType: "NUMERIC" },
  { name: "JSS 2", level: "JSS 2", assessmentType: "NUMERIC" },
  { name: "JSS 3", level: "JSS 3", assessmentType: "NUMERIC" },
  { name: "SSS 1", level: "SSS 1", assessmentType: "NUMERIC" },
  { name: "SSS 2", level: "SSS 2", assessmentType: "NUMERIC" },
  { name: "SSS 3", level: "SSS 3", assessmentType: "NUMERIC" },
];

const db = getDb();
const existingClasses = await db.collection("classes").get();

if (existingClasses.size === 0) {
  for (const c of classes) {
    await db.collection("classes").add(c);
  }
  process.stdout.write(`✅ Successfully seeded ${classes.length} Secondary classes.\n`);
} else {
  process.stdout.write("⚠️ Classes already exist. Skipping seeding to prevent duplicates.\n");
}
