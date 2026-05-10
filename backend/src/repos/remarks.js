import admin from "firebase-admin";
import { getDb } from "../firebase.js";

function remarkId({ session, term, studentId }) {
  return `${session}_${term}_${studentId}`;
}

export async function setTeacherRemark({ session, term, studentId, teacherRemark, setBy }) {
  const db = getDb();
  const ref = db.collection("remarks").doc(remarkId({ session, term, studentId }));
  await ref.set(
    {
      session,
      term,
      studentId,
      teacherRemark,
      teacherRemarkBy: setBy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function setPrincipalRemark({ session, term, studentId, principalRemark, setBy }) {
  const db = getDb();
  const ref = db.collection("remarks").doc(remarkId({ session, term, studentId }));
  await ref.set(
    {
      session,
      term,
      studentId,
      principalRemark,
      principalRemarkBy: setBy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function getRemarks({ session, term, studentId }) {
  const db = getDb();
  const snap = await db.collection("remarks").doc(remarkId({ session, term, studentId })).get();
  return snap.exists ? snap.data() : null;
}

