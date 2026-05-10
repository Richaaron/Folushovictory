import admin from "firebase-admin";
import { getDb } from "../firebase.js";

function scoreId({ session, term, classId, studentId, subjectId }) {
  return `${session}_${term}_${classId}_${studentId}_${subjectId}`;
}

export async function upsertNumericScore({ session, term, classId, studentId, subjectId, ca, exam, enteredBy }) {
  const db = getDb();
  const ref = db.collection("scores").doc(scoreId({ session, term, classId, studentId, subjectId }));
  await ref.set(
    {
      session,
      term,
      classId,
      studentId,
      subjectId,
      type: "NUMERIC",
      ca,
      exam,
      enteredBy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function upsertTraitScore({ session, term, classId, studentId, subjectId, rating, enteredBy }) {
  const db = getDb();
  const ref = db.collection("scores").doc(scoreId({ session, term, classId, studentId, subjectId }));
  await ref.set(
    {
      session,
      term,
      classId,
      studentId,
      subjectId,
      type: "TRAIT",
      rating,
      enteredBy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function listScoresForClass({ session, term, classId }) {
  const db = getDb();
  const snap = await db
    .collection("scores")
    .where("session", "==", session)
    .where("term", "==", term)
    .where("classId", "==", classId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listScoresForStudent({ session, term, studentId }) {
  const db = getDb();
  const snap = await db
    .collection("scores")
    .where("session", "==", session)
    .where("term", "==", term)
    .where("studentId", "==", studentId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

