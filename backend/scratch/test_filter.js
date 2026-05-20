import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  console.log("--- Fetching Student ---");
  const student = await SafeDatabase.getById("students", "fvs-2026-0052");
  console.log("Student:", JSON.stringify(student, null, 2));

  console.log("--- Fetching Class ---");
  const cls = await SafeDatabase.getById("classes", student.classId);
  console.log("Class:", JSON.stringify(cls, null, 2));

  console.log("--- Fetching Subjects ---");
  const { data: allSubjects } = await SafeDatabase.query("subjects", [], { pageSize: 1000 });
  console.log(`Fetched ${allSubjects.length} subjects.`);

  console.log("--- Running Frontend Logic ---");
  
  if (cls.level === 'SSS') {
    const coreGeneralSubjects = [
      'Mathematics', 'English Language', 'Marketing', 
      'Citizenship and Heritage studies', 'Economics', 'Biology'
    ];
    const trackSubjectNames = {
      'Science': ['Chemistry', 'Physics'],
      'Art': ['Government', 'Literature in English'],
      'Commercial': ['Financial Accounting', 'Commerce']
    };
    
    const studentStream = student.stream || cls.track;
    console.log(`studentStream: "${studentStream}"`);
    
    const streamSpecific = trackSubjectNames[studentStream] || [];
    console.log("streamSpecific:", streamSpecific);
    
    const automatedSubjectNames = [...coreGeneralSubjects, ...streamSpecific];
    console.log("automatedSubjectNames:", automatedSubjectNames);
    
    const automatedSubjects = allSubjects.filter((s) => 
      s.level === 'SSS' && 
      automatedSubjectNames.includes(s.name)
    );
    console.log("automatedSubjects count:", automatedSubjects.length);
    console.log("automatedSubjects names:", automatedSubjects.map(s => s.name));
    
    const studentSubjectIds = student.subjectIds || [];
    const studentSubjects = allSubjects.filter((s) => 
      studentSubjectIds.includes(s.id)
    );
    console.log("studentSubjects count:", studentSubjects.length);
    console.log("studentSubjects names:", studentSubjects.map(s => s.name));
    
    const manualSubjectIds = cls.subjectIds || [];
    const manualSubjects = allSubjects.filter((s) => 
      manualSubjectIds.includes(s.id)
    );
    console.log("manualSubjects count:", manualSubjects.length);
    
    const subjectMap = new Map();
    automatedSubjects.forEach((s) => subjectMap.set(s.id, s));
    studentSubjects.forEach((s) => subjectMap.set(s.id, s));
    manualSubjects.forEach((s) => subjectMap.set(s.id, s));
    
    const filteredSubjects = Array.from(subjectMap.values());
    const sortedSubjects = filteredSubjects.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("--- Resulting Subjects ---");
    console.log(sortedSubjects.map(s => `- ${s.name} (ID: ${s.id}, Track: ${s.track})`).join("\n"));
  } else {
    console.log("Not SSS level class!");
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
