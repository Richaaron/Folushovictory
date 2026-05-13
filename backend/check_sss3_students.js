import { getDb } from "./src/firebase.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    const db = getDb();
    const classId = "fcQHXakqLqvdsx2juEPw"; // SSS 3 ID from audit
    const snap = await db.collection("students").where("classId", "==", classId).get();
    console.log(`Total students in SSS 3 (${classId}): ${snap.size}`);
    snap.docs.forEach(doc => {
      console.log(`- ${doc.data().firstName} ${doc.data().lastName}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
