import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function createStudent(student) {
  const db = getDb();
  const ref = db.collection("students").doc(student.studentId);
  await ref.create({
    ...student,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function listStudentsByClass(classId) {
  const db = getDb();
  const snap = await db.collection("students").where("classId", "==", classId).orderBy("lastName").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getStudentById(studentId) {
  const db = getDb();
  const snap = await db.collection("students").doc(studentId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

