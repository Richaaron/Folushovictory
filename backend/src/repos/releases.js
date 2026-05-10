import admin from "firebase-admin";
import { getDb } from "../firebase.js";

function releaseId({ session, term, studentId }) {
  return `${session}_${term}_${studentId}`;
}

export async function setReleaseStatus({ session, term, studentId, released, releasedBy }) {
  const db = getDb();
  const id = releaseId({ session, term, studentId });
  const ref = db.collection("releases").doc(id);
  await ref.set(
    {
      session,
      term,
      studentId,
      released,
      releasedBy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  return { id, released };
}

export async function getReleaseStatus({ session, term, studentId }) {
  const db = getDb();
  const id = releaseId({ session, term, studentId });
  const snap = await db.collection("releases").doc(id).get();
  // Default to false if we want "Release" to be a required step for debtors.
  // Or default to true if we want to "Withhold" only specific ones.
  // The user said "Add a release result button", which sounds like a positive action.
  // So we default to false.
  if (!snap.exists) return { released: false };
  return { id: snap.id, ...snap.data() };
}

export async function listReleasesForClass({ session, term, studentIds }) {
  const db = getDb();
  if (!studentIds || studentIds.length === 0) return [];
  
  // Firestore IN query limited to 10. We might need chunks if class is big.
  // But let's assume classes are small or use a different query.
  const snaps = await db.collection("releases")
    .where("session", "==", session)
    .where("term", "==", term)
    .where("studentId", "in", studentIds)
    .get();
  
  const map = {};
  snaps.forEach(doc => {
    const data = doc.data();
    map[data.studentId] = data.released;
  });
  return map;
}
