import { getFirebaseApp, getDb } from "../src/firebase.js";
import { assertConfig } from "../src/config.js";

assertConfig();
getFirebaseApp();

const db = getDb();

async function checkJanetAndPrimary5() {
  try {
    console.log("🔍 Fetching all users to find Janet...");
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const janet = users.find(u => 
      (u.displayName && u.displayName.toLowerCase().includes("janet")) ||
      (u.username && u.username.toLowerCase().includes("janet"))
    );

    if (!janet) {
      console.log("❌ Janet not found. Listing all teachers for comparison:");
      users.filter(u => u.role === "TEACHER").forEach(t => {
        console.log(`- Name: ${t.displayName}, Username: ${t.username}, ID: ${t.id}`);
      });
      return;
    }

    console.log(`✅ Found Janet:`);
    console.log(`   ID: ${janet.id}`);
    console.log(`   Username: ${janet.username}`);
    console.log(`   DisplayName: ${janet.displayName}`);
    console.log(`   Role: ${janet.role}`);
    console.log(`   FormClassId: ${janet.formClassId}`);

    const janetId = janet.username || janet.id;
    await checkClasses(db, janetId);
  } catch (err) {
    console.error("❌ Error in checkJanetAndPrimary5:", err);
  }
}

async function checkClasses(db, username) {
  console.log(`\n🔍 Checking all classes...`);
  const classesSnap = await db.collection("classes").get();
  let foundForm = false;
  
  classesSnap.forEach(doc => {
    const data = doc.data();
    const isFormTeacher = (data.formTeacherUsername && data.formTeacherUsername.toLowerCase() === username.toLowerCase());
    
    if (data.name && data.name.toLowerCase().includes("primary 5")) {
      console.log(`ℹ️ [Class Found] Name: ${data.name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   FormTeacherUsername: ${data.formTeacherUsername}`);
      console.log(`   Level: ${data.level}`);
      if (isFormTeacher) {
        console.log(`   ✅ This is Janet's form class!`);
        foundForm = true;
      } else {
        console.log(`   ❌ This is NOT Janet's form class (Mismatch: ${data.formTeacherUsername} vs ${username})`);
      }
    } else if (isFormTeacher) {
      console.log(`✅ [Other Form Class Found] Name: ${data.name}, ID: ${doc.id}`);
      foundForm = true;
    }
  });
  
  if (!foundForm) {
    console.log("\n❌ Janet is not recorded as a form teacher in ANY class.");
  }
}

checkJanetAndPrimary5();
