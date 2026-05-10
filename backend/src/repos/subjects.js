import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function createSubject(data) {
  const db = getDb();
  const ref = await db.collection("subjects").add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function listSubjects() {
  const db = getDb();
  const snap = await db.collection("subjects").orderBy("name").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSubjectById(subjectId) {
  const db = getDb();
  const snap = await db.collection("subjects").doc(subjectId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

