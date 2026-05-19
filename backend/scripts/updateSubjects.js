import dotenv from "dotenv";
dotenv.config();

import { assertConfig } from "../src/config.js";
import { getFirebaseApp, getDb } from "../src/firebase.js";

assertConfig();
getFirebaseApp();

const correctSubjects = [
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
  { name: "IRS JSS", level: "JSS" },
  { name: "CRS JSS", level: "JSS" },

  // SENIOR SECONDARY - General Subjects (all tracks)
  { name: "Mathematics", level: "SSS", track: "General" },
  { name: "English Language", level: "SSS", track: "General" },
  { name: "Biology", level: "SSS", track: "General" },
  { name: "Economics", level: "SSS", track: "General" },
  { name: "IRS SSS", level: "SSS", track: "General" },
  { name: "CRS SSS", level: "SSS", track: "General" },
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

const db = getDb();

try {
  console.log("Deleting all existing subjects...");
  const existingSubjects = await db.collection("subjects").get();
  for (const doc of existingSubjects.docs) {
    await doc.ref.delete();
  }
  console.log(`Deleted ${existingSubjects.size} subjects`);

  console.log("Seeding correct subjects...");
  for (const sub of correctSubjects) {
    const subjectData = { 
      name: sub.name, 
      level: sub.level,
      createdAt: new Date().toISOString()
    };
    if (sub.track) {
      subjectData.track = sub.track;
    }
    await db.collection("subjects").add(subjectData);
  }
  console.log(`✓ Successfully seeded ${correctSubjects.length} subjects with correct structure`);
  console.log("\nSubjects by level:");
  console.log("- Primary: 17 subjects");
  console.log("- JSS: 12 subjects");
  console.log("- SSS General: 7 subjects");
  console.log("- SSS Science: 2 subjects");
  console.log("- SSS Art: 2 subjects");
  console.log("- SSS Commercial: 2 subjects");
  process.exit(0);
} catch (error) {
  console.error("Error updating subjects:", error);
  process.exit(1);
}
