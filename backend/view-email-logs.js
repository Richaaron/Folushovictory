import { getDb } from "./src/firebase.js";
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    const db = getDb();
    const snap = await db.collection("logs")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    
    console.log(`Found ${snap.size} recent email logs:`);
    snap.docs.forEach(doc => {
      const data = doc.data();
      const time = data.createdAt ? data.createdAt.toDate().toLocaleString() : 'Unknown';
      console.log(`[${time}] To: ${data.to} | Subject: ${data.subject} | Status: ${data.status}`);
      if (data.error) console.log(`  Error: ${data.error}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
