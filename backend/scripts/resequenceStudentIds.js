import { assertConfig } from "../src/config.js";
import { getDb } from "../src/firebase.js";

assertConfig();

const db = getDb();

async function resequenceStudentIds() {
  try {
    console.log("Starting student ID resequencing...");

    const studentsSnap = await db.collection("students").get();
    const students = studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Sort by current studentId to keep existing order
    students.sort((a, b) => String(a.studentId || "").localeCompare(String(b.studentId || ""), undefined, { numeric: true }));

    console.log(`Found ${students.length} students to resequence`);

    // We'll perform writes in batches of 500 (Firestore limit)
    const batchSize = 400;
    let counter = 0;

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = db.batch();
      const chunk = students.slice(i, i + batchSize);

      for (let j = 0; j < chunk.length; j++) {
        const idx = i + j;
        const student = chunk[j];
        const oldStudentId = student.studentId;
        const newStudentId = `FVS-2026-${String(idx + 1).padStart(4, "0")}`;

        console.log(`${oldStudentId} -> ${newStudentId}`);

        const oldRef = db.collection("students").doc(oldStudentId);
        const newRef = db.collection("students").doc(newStudentId);

        const studentData = { ...student };
        studentData.studentId = newStudentId;

        // Delete old and create new
        batch.delete(oldRef);
        batch.set(newRef, studentData);

        // Update parent users that reference this studentId
        const parentSnap = await db.collection("users").where("studentId", "==", oldStudentId).get();
        for (const parentDoc of parentSnap.docs) {
          batch.update(db.collection("users").doc(parentDoc.id), { studentId: newStudentId });
        }

        counter++;
      }

      await batch.commit();
      console.log(`Committed batch, processed ${Math.min(i + batchSize, students.length)} / ${students.length}`);
    }

    console.log(`✅ Student ID resequencing completed successfully! Processed ${counter} students.`);
  } catch (error) {
    console.error("❌ Error resequencing student IDs:", error);
    process.exit(1);
  }
}

resequenceStudentIds().then(() => process.exit(0));
