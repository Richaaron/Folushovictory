import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function getUserByUsername(username) {
  const db = getDb();
  const snap = await db.collection("users").doc(username).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function createUser(user) {
  const db = getDb();
  const ref = db.collection("users").doc(user.username);
  const payload = {
    ...user,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await ref.create(payload);
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function updateUser(username, patch) {
  const db = getDb();
  const ref = db.collection("users").doc(username);
  await ref.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

