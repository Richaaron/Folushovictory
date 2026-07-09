import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: scores } = await SafeDatabase.query("scores", [], { pageSize: 1000 });
  const irsId = "ilyOfETrDVEW5VjuxvUf";
  const crsId = "SYo7gWINpG0hHj2lIWv1";

  const matches = scores.filter(s => s.subjectId === irsId || s.subjectId === crsId);
  console.log(`Religious Studies scores in entire DB (${matches.length}):`);
  
  const { data: allClasses } = await SafeDatabase.query("classes", [], { pageSize: 100 });
  const { data: allSubjects } = await SafeDatabase.query("subjects", [], { pageSize: 1000 });

  matches.forEach(s => {
    const cls = allClasses.find(c => c.id === s.classId);
    const sub = allSubjects.find(x => x.id === s.subjectId);
    console.log(`Student: ${s.studentId} | Class: ${cls?.name} | Subject: ${sub?.name} | Session: ${s.session} | Term: ${s.term} | CA1: ${s.ca1} | CA2: ${s.ca2} | Exam: ${s.exam} | EnteredBy: ${s.enteredBy}`);
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
