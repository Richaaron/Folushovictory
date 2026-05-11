import { assertConfig } from "../src/config.js";
import { getFirebaseApp, getDb } from "../src/firebase.js";
import { getGradingScale, setGradingScale } from "../src/repos/config.js";

assertConfig();
getFirebaseApp();

const defaultScale = {
  grades: [
    { letter: "A", min: 70, max: 100, remark: "Excellent" },
    { letter: "B", min: 60, max: 69, remark: "Very Good" },
    { letter: "C", min: 50, max: 59, remark: "Good" },
    { letter: "D", min: 45, max: 49, remark: "Pass" },
    { letter: "F", min: 0, max: 44, remark: "Fail" }
  ]
};

const subjects = [
  { name: "Mathematics", level: "Primary" },
  { name: "English Language", level: "Primary" },
  { name: "Basic Science", level: "Primary" },
  { name: "Basic Technology", level: "Primary" },
  { name: "Mathematics", level: "JSS" },
  { name: "English Language", level: "JSS" },
  { name: "Basic Science", level: "JSS" },
  { name: "Basic Technology", level: "JSS" },
  { name: "Mathematics", level: "SSS" },
  { name: "English Language", level: "SSS" },
  { name: "Chemistry", level: "SSS" },
  { name: "Physics", level: "SSS" },
  { name: "Biology", level: "SSS" },
  { name: "Further Mathematics", level: "SSS" },
  { name: "Agricultural Science", level: "JSS" },
  { name: "Agricultural Science", level: "SSS" },
  { name: "National Values", level: "Primary" },
  { name: "National Values", level: "JSS" },
  { name: "Physical & Health Education", level: "Primary" },
  { name: "Physical & Health Education", level: "JSS" },
  { name: "Computer Studies", level: "Primary" },
  { name: "Computer Studies", level: "JSS" },
  { name: "Computer Studies", level: "SSS" },
  { name: "Civic Education", level: "JSS" },
  { name: "Civic Education", level: "SSS" },
  { name: "Geography", level: "SSS" },
  { name: "Accounting", level: "SSS" },
  { name: "Commerce", level: "SSS" },
  { name: "Government", level: "SSS" },
  { name: "Business Studies", level: "JSS" },
  { name: "Literature in English", level: "SSS" },
  { name: "Fine Arts", level: "JSS" },
  { name: "Hausa", level: "JSS" },
  { name: "Home Economics", level: "Primary" },
  { name: "Home Economics", level: "JSS" }
];

const db = getDb();

const scale = await getGradingScale();
if (!scale || !Array.isArray(scale.grades) || scale.grades.length === 0) {
  await setGradingScale(defaultScale);
  process.stdout.write("Seeded grading scale\n");
}

// Clear and re-seed subjects if they don't have levels, to avoid mixup
const existingSubjects = await db.collection("subjects").get();
let needsReseed = false;
if (existingSubjects.size > 0) {
  const first = existingSubjects.docs[0].data();
  if (!first.level) needsReseed = true;
} else {
  needsReseed = true;
}

if (needsReseed) {
  process.stdout.write("Updating subjects to include academic levels...\n");
  for (const doc of existingSubjects.docs) {
    await doc.ref.delete();
  }
  for (const sub of subjects) {
    await db.collection("subjects").add({ 
      name: sub.name, 
      level: sub.level,
      createdAt: new Date().toISOString()
    });
  }
  process.stdout.write(`Seeded ${subjects.length} leveled subjects\n`);
} else {
  process.stdout.write("Leveled subjects already exist, skipping\n");
}

const defaultClasses = [
  { name: "PRE-NURSERY", level: "NUR" },
  { name: "NURSERY 1", level: "NUR" },
  { name: "NURSERY 2", level: "NUR" },
  { name: "PRIMARY 1", level: "PRY" },
  { name: "PRIMARY 2", level: "PRY" },
  { name: "PRIMARY 3", level: "PRY" },
  { name: "PRIMARY 4", level: "PRY" },
  { name: "PRIMARY 5", level: "PRY" },
  { name: "PRIMARY 6", level: "PRY" },
  { name: "JSS 1", level: "JSS" },
  { name: "JSS 2", level: "JSS" },
  { name: "JSS 3", level: "JSS" },
  { name: "SSS 1", level: "SSS" },
  { name: "SSS 2", level: "SSS" },
  { name: "SSS 3", level: "SSS" }
];

const existingClasses = await db.collection("classes").get();
process.stdout.write("Synchronizing academic levels for all classes...\n");
const classMap = new Map(existingClasses.docs.map(d => [d.data().name.toUpperCase(), d]));

for (const cls of defaultClasses) {
  const existingDoc = classMap.get(cls.name);
  if (existingDoc) {
    // Update level if it's non-standard
    if (existingDoc.data().level !== cls.level) {
      await existingDoc.ref.update({ level: cls.level });
      process.stdout.write(`Updated level for ${cls.name} -> ${cls.level}\n`);
    }
  } else {
    // Add missing class
    await db.collection("classes").add({
      ...cls,
      createdAt: new Date().toISOString()
    });
    process.stdout.write(`Added missing class: ${cls.name}\n`);
  }
}
process.stdout.write("Institutional class structure synchronized.\n");

