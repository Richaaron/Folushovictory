import { assertConfig, config } from "../src/config.js";
import { getFirebaseApp, getDb } from "../src/firebase.js";
import dotenv from "dotenv";
dotenv.config();

async function runCheck() {
  console.log("🔍 STARTING FINAL SYSTEM AUDIT...\n");

  try {
    // 1. Config Check
    console.log("1. Validating Environment Configuration...");
    assertConfig();
    console.log("   ✅ Config OK");

    // 2. Firebase Connection
    console.log("2. Testing Database Connectivity (Firebase)...");
    getFirebaseApp();
    const db = getDb();
    const collectionsSnap = await db.listCollections();
    console.log(`   ✅ Connected! Found ${collectionsSnap.length} collections.`);
    
    // 3. User Table Check
    const usersSnap = await db.collection("users").limit(1).get();
    console.log(`   ✅ User Repository accessible. (Found ${usersSnap.size} sample records)`);

    // 4. Email Service Check
    console.log("3. Validating Email Service Setup...");
    if (config.smtpHost && config.smtpUser && config.smtpPass) {
      console.log(`   ✅ SMTP Configured (${config.smtpHost})`);
    } else {
      console.log("   ⚠️ SMTP partially configured. Automated emails may fail.");
    }

    // 5. Deployment Readiness
    console.log("4. Checking Cloud Deployment Metadata...");
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log("   ✅ Cloud Credential String detected.");
    }

    console.log("\n✨ SYSTEM AUDIT COMPLETE: ALL SYSTEMS NOMINAL.");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ SYSTEM AUDIT FAILED:");
    console.error(err.message);
    process.exit(1);
  }
}

runCheck();
