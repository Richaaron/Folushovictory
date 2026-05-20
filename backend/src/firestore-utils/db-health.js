import { getSupabase } from "../supabase.js";

/**
 * Database health check utilities
 * Monitors Supabase connection and data consistency
 */

let lastHealthCheckTime = null;
let healthCheckInterval = 5 * 60 * 1000; // 5 minutes
let isHealthy = true;

export async function performHealthCheck() {
  try {
    const startTime = Date.now();
    const { data, error } = await getSupabase()
      .from("config")
      .select("key")
      .limit(1);

    if (error) throw error;

    const duration = Date.now() - startTime;

    if (duration > 10000) {
      console.warn(`[DB Health] Slow health check: ${duration}ms`);
    }

    isHealthy = true;
    lastHealthCheckTime = new Date();
    return { status: "healthy", duration, timestamp: lastHealthCheckTime };
  } catch (error) {
    isHealthy = false;
    console.error("[DB Health] Health check failed:", error.message);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date()
    };
  }
}

export function isFirestoreHealthy() {
  return isHealthy;
}

export function getLastHealthCheckTime() {
  return lastHealthCheckTime;
}

/**
 * Check for data consistency issues
 */
export async function validateDataIntegrity() {
  try {
    const issues = [];
    const sb = getSupabase();

    // Fetch students and classes
    const { data: students, error: studErr } = await sb.from("students").select("studentId, classId");
    if (studErr) throw studErr;

    const { data: classes, error: clsErr } = await sb.from("classes").select("id");
    if (clsErr) throw clsErr;

    const validClassIds = new Set(classes.map(c => c.id));

    // Check for orphaned students (students in non-existent classes)
    for (const student of students) {
      if (student.classId && !validClassIds.has(student.classId)) {
        issues.push({
          type: "ORPHANED_STUDENT",
          studentId: student.studentId,
          classId: student.classId,
          severity: "high"
        });
      }
    }

    // Check for orphaned scores
    const { data: scores, error: scErr } = await sb.from("scores").select("id, studentId, subjectId");
    if (scErr) throw scErr;

    const validStudentIds = new Set(students.map(s => s.studentId));

    const { data: subjects, error: subErr } = await sb.from("subjects").select("id");
    if (subErr) throw subErr;

    const validSubjectIds = new Set(subjects.map(s => s.id));

    for (const score of scores) {
      if (!validStudentIds.has(score.studentId)) {
        issues.push({
          type: "ORPHANED_SCORE_STUDENT",
          scoreId: score.id,
          studentId: score.studentId,
          severity: "high"
        });
      }
      if (score.subjectId && !validSubjectIds.has(score.subjectId)) {
        issues.push({
          type: "ORPHANED_SCORE_SUBJECT",
          scoreId: score.id,
          subjectId: score.subjectId,
          severity: "high"
        });
      }
    }

    return { status: "checked", issuesFound: issues.length, issues };
  } catch (error) {
    console.error("[Data Integrity] Check failed:", error);
    return { status: "error", error: error.message };
  }
}

/**
 * Monitor collection sizes and growth
 */
export async function getCollectionMetrics() {
  try {
    const sb = getSupabase();
    const collections = ["students", "classes", "users", "scores", "subjects", "assignments"];
    const metrics = {};

    for (const collection of collections) {
      const { count, error } = await sb
        .from(collection)
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      metrics[collection] = count || 0;
    }

    return { timestamp: new Date(), metrics };
  } catch (error) {
    console.error("[Collection Metrics] Failed:", error);
    return { error: error.message };
  }
}
