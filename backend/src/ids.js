import { SafeDatabase } from "./firestore-utils/index.js";

async function nextCounter(counterId) {
  const exists = await SafeDatabase.exists("counters", counterId);
  if (!exists) {
    await SafeDatabase.upsert("counters", counterId, { value: 0 });
  }
  return await SafeDatabase.increment("counters", counterId, "value", 1);
}

function pad(num, width) {
  return String(num).padStart(width, "0");
}

export async function generateTeacherUsername() {
  const year = new Date().getFullYear();
  const n = await nextCounter(`teachers_${year}`);
  return `tch-${year}-${pad(n, 3)}`;
}

export async function generateStudentId(date = new Date()) {
  const year = date.getFullYear();
  const n = await nextCounter(`students_${year}`);
  return `fvs-${year}-${pad(n, 4)}`;
}

export async function generateParentUsername(date = new Date()) {
  const year = date.getFullYear();
  const n = await nextCounter(`parents_${year}`);
  return `par-${year}-${pad(n, 4)}`;
}

