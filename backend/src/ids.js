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

export async function generateTeacherUsername() {
  const year = new Date().getFullYear();
  const n = await nextCounter(`teachers_${year}`);
  return `TCH-${year}-${pad(n, 3)}`;
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

