import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function createClass(data) {
  const db = getDb();
  const ref = await db.collection("classes").add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function listClasses() {
  const db = getDb();
  const snap = await db.collection("classes").orderBy("name").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getClassById(classId) {
  const db = getDb();
  const snap = await db.collection("classes").doc(classId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function updateClass(classId, patch) {
  const db = getDb();
  const ref = db.collection("classes").doc(classId);
  await ref.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

