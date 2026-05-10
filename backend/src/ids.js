import { getDb } from "./firebase.js";

async function nextCounter(counterId) {
  const db = getDb();
  const ref = db.collection("counters").doc(counterId);

  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? Number(snap.data().value || 0) : 0;
    const value = current + 1;
    tx.set(ref, { value }, { merge: true });
    return value;
  });

  return next;
}

function pad(num, width) {
  return String(num).padStart(width, "0");
}

export async function generateTeacherUsername(displayName) {
  const firstName = String(displayName).split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
  const base = `${firstName}@folusho.com`;
  
  const db = getDb();
  const snap = await db.collection("users").doc(base).get();
  
  if (!snap.exists) return base;
  
  // If exists, add a counter
  const n = await nextCounter(`teacher_email_${firstName}`);
  return `${firstName}${n}@folusho.com`;
}

export async function generateStudentId(date = new Date()) {
  const year = date.getFullYear();
  const n = await nextCounter(`students_${year}`);
  return `FVS-${year}-${pad(n, 4)}`;
}

export async function generateParentUsername(date = new Date()) {
  const year = date.getFullYear();
  const n = await nextCounter(`parents_${year}`);
  return `PAR-${year}-${pad(n, 4)}`;
}

