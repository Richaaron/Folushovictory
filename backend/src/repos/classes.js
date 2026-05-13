import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function createClass(data) {
  const db = getDb();
  const formTeacherUsername = data.formTeacherUsername ? String(data.formTeacherUsername).toLowerCase().trim() : null;
  const ref = await db.collection("classes").add({
    ...data,
    formTeacherUsername,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function listClasses() {
  const db = getDb();
  const snap = await db.collection("classes").get();
  const classes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  classes.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  return classes;
}

export async function getClassById(classId) {
  const db = getDb();
  const snap = await db.collection("classes").doc(classId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function updateClass(classId, patch) {
  const db = getDb();
  const ref = db.collection("classes").doc(classId);
  if (patch.formTeacherUsername) {
    patch.formTeacherUsername = String(patch.formTeacherUsername).toLowerCase().trim();
  }
  await ref.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}


export async function listClassesByFormTeacher(username) {
  const db = getDb();
  const normalized = username ? String(username).toLowerCase().trim() : "";
  const snap = await db.collection("classes").where("formTeacherUsername", "==", normalized).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}export async function revokeFormTeacherStatus(username) {
  const db = getDb();
  const normalized = username ? String(username).toLowerCase().trim() : "";
  const snap = await db.collection("classes").where("formTeacherUsername", "==", normalized).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, { 
      formTeacherUsername: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
}
