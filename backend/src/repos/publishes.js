import admin from "firebase-admin";
import { getDb } from "../firebase.js";

function publishId({ classId, session, term }) {
  return `${session}_${term}_${classId}`;
}

export async function isPublished({ classId, session, term }) {
  const db = getDb();
  const id = publishId({ classId, session, term });
  const snap = await db.collection("publishes").doc(id).get();
  return snap.exists;
}

export async function publishResults({ classId, session, term, publishedBy }) {
  const db = getDb();
  const id = publishId({ classId, session, term });
  const ref = db.collection("publishes").doc(id);
  await ref.set(
    {
      classId,
      session,
      term,
      status: "PUBLISHED",
      publishedBy,
      publishedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function getPublish({ classId, session, term }) {
  const db = getDb();
  const id = publishId({ classId, session, term });
  const snap = await db.collection("publishes").doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

