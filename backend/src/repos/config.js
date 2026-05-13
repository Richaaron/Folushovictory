import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function getGradingScale() {
  const db = getDb();
  const snap = await db.collection("config").doc("gradingScale").get();
  return snap.exists ? snap.data() : null;
}

export async function setGradingScale(scale) {
  const db = getDb();
  const ref = db.collection("config").doc("gradingScale");
  await ref.set(
    {
      ...scale,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

export async function getTermMeta({ session, term }) {
  const db = getDb();
  const snap = await db.collection("termMeta").doc(`${session}_${term}`).get();
  return snap.exists ? snap.data() : null;
}

export async function setTermMeta({ session, term, resumptionDate }) {
  const db = getDb();
  const ref = db.collection("termMeta").doc(`${session}_${term}`);
  await ref.set(
    {
      session,
      term,
      resumptionDate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}
export async function getSchoolSettings() {
  const db = getDb();
  const snap = await db.collection("config").doc("schoolSettings").get();
  return snap.exists ? snap.data() : { 
    name: "Folusho Victory Schools", 
    motto: "Knowledge · Integrity · Excellence",
    address: "",
    phone: "",
    email: "",
    principalName: "",
    principalSignatureUrl: "",
    currentSession: "2023/2024",
    currentTerm: "First"
  };
}

export async function setSchoolSettings(settings) {
  const db = getDb();
  const ref = db.collection("config").doc("schoolSettings");
  await ref.set(
    {
      ...settings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}
