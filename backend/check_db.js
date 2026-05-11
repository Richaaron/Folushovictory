import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Manually initialize admin to avoid import issues if possible
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testConnection() {
  console.log("Checking Firestore connection for folusho-victory-schools...");
  try {
    const classesSnapshot = await db.collection('classes').get();
    console.log(`Success! Found ${classesSnapshot.size} classes in the database.`);
    
    if (classesSnapshot.size > 0) {
      console.log("Sample classes:");
      classesSnapshot.docs.slice(0, 3).forEach(doc => {
        console.log(`- ${doc.id}: ${doc.data().name}`);
      });
    }

    const studentsSnapshot = await db.collection('students').limit(1).get();
    console.log(`Found ${studentsSnapshot.size} student record(s).`);

    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} total user(s) in the system.`);

    console.log("\nDATABASE STATUS: CONNECTED & OPERATIONAL");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
  process.exit();
}

testConnection();
