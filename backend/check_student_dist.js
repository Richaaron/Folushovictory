import { getDb } from "./src/firebase.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    const db = getDb();
    const snap = await db.collection("students").get();
    const classMap = {};
    snap.docs.forEach(doc => {
      const cid = doc.data().classId;
      classMap[cid] = (classMap[cid] || 0) + 1;
    });
    console.log("Student distribution by class ID:");
    console.log(JSON.stringify(classMap, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
