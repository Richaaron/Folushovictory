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
  const snap = await db.collection("students").where("classId", "==", classId).get();
  const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  students.sort((a, b) => String(a.lastName || "").localeCompare(String(b.lastName || "")));
  return students;
}

export async function getStudentById(studentId) {
  const db = getDb();
  const snap = await db.collection("students").doc(studentId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}


export async function updateStudent(studentId, patch) {
  const db = getDb();
  const ref = db.collection("students").doc(studentId);
  await ref.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteStudent(studentId) {
  const db = getDb();
  await db.collection("students").doc(studentId).delete();
  return true;
}
