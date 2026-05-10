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
  "Mathematics",
  "English Language",
  "Basic Science",
  "Basic Technology",
  "National Values",
  "Agriculture Science",
  "Phonics",
  "Physical & Health Education",
  "Vocational Aptitude",
  "Quantitative Reasoning",
  "Verbal Reasoning",
  "Literature",
  "Creative Arts",
  "Writing (P1–P3)",
  "Home Economics",
  "Computer Studies",
  "Religious Studies",
  "Business Studies",
  "Hausa",
  "Fine Arts",
  "Chemistry",
  "Physics",
  "Government",
  "Literature in English",
  "Biology",
  "Marketing",
  "Civic Education",
  "Geography",
  "Accounting",
  "Commerce"
];

const db = getDb();

const scale = await getGradingScale();
if (!scale || !Array.isArray(scale.grades) || scale.grades.length === 0) {
  await setGradingScale(defaultScale);
  process.stdout.write("Seeded grading scale\n");
}

const existingSubjects = await db.collection("subjects").get();
if (existingSubjects.size === 0) {
  for (const name of subjects) {
    await db.collection("subjects").add({ name });
  }
  process.stdout.write(`Seeded ${subjects.length} subjects\n`);
} else {
  process.stdout.write("Subjects already exist, skipping\n");
}

