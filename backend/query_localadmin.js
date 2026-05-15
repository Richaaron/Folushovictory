import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function queryUser() {
  console.log("=== Querying Firestore for user: localadmin ===\n");
  try {
    const userSnapshot = await db.collection('users')
      .where('username', '==', 'localadmin')
      .get();

    if (userSnapshot.empty) {
      console.log("No user found with username='localadmin'");
      process.exit();
    }

    console.log(`Found ${userSnapshot.size} user(s) matching username='localadmin'\n`);

    userSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log("=== COMPLETE USER DOCUMENT ===");
      console.log(`Document ID: ${doc.id}\n`);
      console.log(JSON.stringify(userData, null, 2));
      console.log("\n=== USER DETAILS ===");
      console.log(`Username: ${userData.username || 'N/A'}`);
      console.log(`Role: ${userData.role || 'N/A'}`);
      console.log(`Portal: ${userData.portal || 'N/A'}`);
      console.log(`Email: ${userData.email || 'N/A'}`);
      console.log(`Status: ${userData.status || 'N/A'}`);
    });

    console.log("\nQuery completed successfully!");
  } catch (error) {
    console.error("Error querying user:", error);
  }
  process.exit();
}

queryUser();
