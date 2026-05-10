import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function createAssignment(data) {
  const db = getDb();
  const ref = await db.collection("assignments").add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function listAssignmentsByTeacher(teacherUsername) {
  const db = getDb();
  const snap = await db.collection("assignments").where("teacherUsername", "==", teacherUsername).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAssignmentsByClass(classId) {
  const db = getDb();
  const snap = await db.collection("assignments").where("classId", "==", classId).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAssignmentByTriplet({ teacherUsername, classId, subjectId }) {
  const db = getDb();
  const snap = await db
    .collection("assignments")
    .where("teacherUsername", "==", teacherUsername)
    .where("classId", "==", classId)
    .where("subjectId", "==", subjectId)
    .get();
  const doc = snap.docs[0];
  return doc ? { id: doc.id, ...doc.data() } : null;
}

export async function getAssignmentById(assignmentId) {
  const db = getDb();
  const snap = await db.collection("assignments").doc(assignmentId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

