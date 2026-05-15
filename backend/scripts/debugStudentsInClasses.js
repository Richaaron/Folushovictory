import { assertConfig } from '../src/config.js';
import { getFirebaseApp, getDb } from '../src/firebase.js';

assertConfig();
getFirebaseApp();
const db = getDb();

async function debugStudents() {
  console.log("=== DEBUGGING STUDENTS IN CLASSES ===\n");

  // Get all classes
  const classesSnap = await db.collection("classes").get();
  const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`📚 Total Classes: ${classes.length}`);
  classes.forEach(c => {
    console.log(`  - [${c.id}] ${c.name} (${c.level} ${c.track || ''})`);
  });

  console.log("\n=== CHECKING STUDENTS ===\n");

  // Get all students
  const studentsSnap = await db.collection("students").get();
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`👥 Total Students: ${students.length}`);
  
  // Group by classId
  const studentsByClass = {};
  for (const student of students) {
    const cid = student.classId || "(NO CLASS ID)";
    if (!studentsByClass[cid]) {
      studentsByClass[cid] = [];
    }
    studentsByClass[cid].push(student);
  }

  console.log("\n📊 Students by Class ID:\n");
  for (const [classId, classStudents] of Object.entries(studentsByClass)) {
    const classInfo = classes.find(c => c.id === classId);
    const className = classInfo ? classInfo.name : "UNKNOWN";
    console.log(`  [${classId}] ${className}`);
    console.log(`    Count: ${classStudents.length}`);
    classStudents.slice(0, 3).forEach(s => {
      console.log(`      - ${s.studentId}: ${s.firstName} ${s.lastName}`);
    });
    if (classStudents.length > 3) {
      console.log(`      ... and ${classStudents.length - 3} more`);
    }
  }

  // Check for JSS 1 specifically
  console.log("\n=== JSS 1 ANALYSIS ===\n");
  const jss1 = classes.find(c => c.name.includes("JSS 1"));
  if (jss1) {
    console.log(`✅ Found JSS 1 class: ${jss1.id}`);
    const jss1Students = studentsByClass[jss1.id] || [];
    console.log(`📊 JSS 1 has ${jss1Students.length} students`);
    
    if (jss1Students.length === 0) {
      console.log("\n⚠️  NO STUDENTS FOUND IN JSS 1!");
      console.log("Checking if students have a different class reference format...");
      
      // Check if any students have "JSS 1" as classId (string name instead of ID)
      const byName = students.filter(s => s.classId === "JSS 1" || s.classId === "JSS1");
      if (byName.length > 0) {
        console.log(`❌ FOUND ISSUE: ${byName.length} students have classId='JSS 1' (class name) instead of classId='${jss1.id}' (class ID)`);
        console.log(`   This is why students aren't visible in the admin panel!`);
      }
    }
  } else {
    console.log("❌ JSS 1 class not found!");
  }
}

debugStudents().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
