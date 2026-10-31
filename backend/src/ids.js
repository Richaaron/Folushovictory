import { SafeDatabase } from "./firestore-utils/index.js";
import { getSupabase } from "./supabase.js";

const REUSABLE_STUDENT_ID_PREFIX = "reusableStudentId-";

async function claimReusableStudentId() {
  const db = getSupabase();

  while (true) {
    const { data: availableIds, error } = await db
      .from("counters")
      .select("key")
      .like("key", `${REUSABLE_STUDENT_ID_PREFIX}%`)
      .eq("value", 0)
      .order("key", { ascending: true })
      .limit(100);

    if (error) throw error;
    if (!availableIds?.length) return null;

    for (const entry of availableIds) {
      const studentId = String(entry.key).slice(REUSABLE_STUDENT_ID_PREFIX.length);
      const claim = await db
        .from("counters")
        .update({ value: 1, updatedAt: new Date().toISOString() })
        .eq("key", entry.key)
        .eq("value", 0)
        .select("key")
        .maybeSingle();

      if (claim.error) throw claim.error;
      if (!claim.data) continue;

      const [studentExists, userExists] = await Promise.all([
        SafeDatabase.exists("students", studentId),
        SafeDatabase.exists("users", studentId)
      ]);
      if (studentExists || userExists) continue;

      return studentId;
    }
  }
}

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
  const reusableStudentId = await claimReusableStudentId();
  if (reusableStudentId) return reusableStudentId;

  const year = date.getFullYear();
  const n = await nextCounter(`students_${year}`);
  return `fvs-${year}-${pad(n, 4)}`;
}

export async function releaseStudentId(studentId) {
  const key = `${REUSABLE_STUDENT_ID_PREFIX}${String(studentId || "").toLowerCase().trim()}`;
  const { error } = await getSupabase()
    .from("counters")
    .update({ value: 0, updatedAt: new Date().toISOString() })
    .eq("key", key)
    .eq("value", 1);

  if (error) throw error;
}

export async function generateParentUsername(date = new Date()) {
  const year = date.getFullYear();
  const n = await nextCounter(`parents_${year}`);
  return `par-${year}-${pad(n, 4)}`;
}
