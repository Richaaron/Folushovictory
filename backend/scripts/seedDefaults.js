import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { getGradingScale, setGradingScale } from "../src/repos/config.js";

assertConfig();

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
  // PRIMARY (P1-P6)
  { name: "Mathematics", level: "Primary" },
  { name: "English Language", level: "Primary" },
  { name: "Basic Science", level: "Primary" },
  { name: "Basic Technology", level: "Primary" },
  { name: "National Values", level: "Primary" },
  { name: "Agriculture Science", level: "Primary" },
  { name: "Phonics", level: "Primary" },
  { name: "Physical & Health Education", level: "Primary" },
  { name: "Vocational Aptitude", level: "Primary" },
  { name: "Quantitative Reasoning", level: "Primary" },
  { name: "Verbal Reasoning", level: "Primary" },
  { name: "Literature", level: "Primary" },
  { name: "Creative Arts", level: "Primary" },
  { name: "Writing", level: "Primary" },
  { name: "Home Economics", level: "Primary" },
  { name: "Computer Studies", level: "Primary" },
  { name: "Religious Studies", level: "Primary" },

  // JUNIOR SECONDARY (JSS1-JSS3)
  { name: "Mathematics", level: "JSS" },
  { name: "English Language", level: "JSS" },
  { name: "Intermidiate Science", level: "JSS" },
  { name: "National Values", level: "JSS" },
  { name: "Livestock Studies", level: "JSS" },
  { name: "Business Studies", level: "JSS" },
  { name: "Physical & Health Education", level: "JSS" },
  { name: "Hausa", level: "JSS" },
  { name: "Fine Arts", level: "JSS" },
  { name: "Home Economics", level: "JSS" },
  { name: "Digital Technology", level: "JSS" },
  { name: "Religious Studies", level: "JSS" },

  // SENIOR SECONDARY - General Subjects (all tracks)
  { name: "Mathematics", level: "SSS", track: "General" },
  { name: "English Language", level: "SSS", track: "General" },
  { name: "Biology", level: "SSS", track: "General" },
  { name: "Marketing", level: "SSS", track: "General" },
  { name: "Citizenship and Heritage studies", level: "SSS", track: "General" },
  { name: "Geography", level: "SSS", track: "General" },
  { name: "Livestock Studies", level: "SSS", track: "General" },

  // SENIOR SECONDARY - Science Track
  { name: "Chemistry", level: "SSS", track: "Science" },
  { name: "Physics", level: "SSS", track: "Science" },

  // SENIOR SECONDARY - Art Track
  { name: "Government", level: "SSS", track: "Art" },
  { name: "Literature in English", level: "SSS", track: "Art" },

  // SENIOR SECONDARY - Commercial Track
  { name: "Financial Accounting", level: "SSS", track: "Commercial" },
  { name: "Commerce", level: "SSS", track: "Commercial" }
];

const scale = await getGradingScale();
if (!scale || !Array.isArray(scale.grades) || scale.grades.length === 0) {
  await setGradingScale(defaultScale);
  process.stdout.write("Seeded grading scale\n");
}

// Clear and re-seed subjects if they don't have levels, to avoid mixup
const { data: existingSubjects } = await SafeDatabase.query("subjects", [], { pageSize: 1000 });
let needsReseed = false;
if (existingSubjects.length > 0) {
  const first = existingSubjects[0];
  if (!first.level) needsReseed = true;
} else {
  needsReseed = true;
}

if (needsReseed) {
  process.stdout.write("Updating subjects to include academic levels and tracks...\n");
  for (const doc of existingSubjects) {
    await SafeDatabase.deleteWithValidation("subjects", doc.id);
  }
  for (const sub of subjects) {
    const subjectData = { 
      name: sub.name, 
      level: sub.level,
      createdAt: new Date().toISOString()
    };
    if (sub.track) {
      subjectData.track = sub.track;
    }
    await SafeDatabase.createWithValidation("subjects", subjectData, "subject", { checkDuplicates: false });
  }
  process.stdout.write(`Seeded ${subjects.length} leveled subjects with track information\n`);
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

const { data: existingClasses } = await SafeDatabase.query("classes", [], { pageSize: 1000 });
process.stdout.write("Synchronizing academic levels for all classes...\n");
const classMap = new Map(existingClasses.map(d => [d.name.toUpperCase(), d]));

for (const cls of defaultClasses) {
  const existingDoc = classMap.get(cls.name);
  if (existingDoc) {
    // Update level if it's non-standard
    if (existingDoc.level !== cls.level) {
      await SafeDatabase.updateWithValidation("classes", existingDoc.id, { level: cls.level }, "class");
      process.stdout.write(`Updated level for ${cls.name} -> ${cls.level}\n`);
    }
  } else {
    // Add missing class
    await SafeDatabase.createWithValidation("classes", {
      ...cls,
      createdAt: new Date().toISOString()
    }, "class", { checkDuplicates: false });
    process.stdout.write(`Added missing class: ${cls.name}\n`);
  }
}
process.stdout.write("Institutional class structure synchronized.\n");
