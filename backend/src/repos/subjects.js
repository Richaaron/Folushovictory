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
  const snap = await db.collection("subjects").get();
  const subjects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  subjects.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  return subjects;
}

export async function getSubjectById(subjectId) {
  const db = getDb();
  const snap = await db.collection("subjects").doc(subjectId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

