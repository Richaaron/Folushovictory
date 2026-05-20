import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

const { data: subjects } = await SafeDatabase.query("subjects", [], { pageSize: 500 });
const targetNames = ["Chemistry", "Physics", "Government", "Literature in English", "Financial Accounting", "Commerce", "Biology", "Mathematics", "English Language", "Marketing", "Citizenship and Heritage studies", "Economics"];

console.log("Matching Subjects:");
subjects.forEach(s => {
  if (targetNames.some(name => s.name.toLowerCase() === name.toLowerCase())) {
    console.log(`- ID: ${s.id}, Name: ${s.name}, Level: ${s.level}, Track: ${s.track}, Category: ${s.category}`);
  }
});

process.exit(0);
