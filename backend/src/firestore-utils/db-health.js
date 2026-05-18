import { getDb } from "../firebase.js";

/**
 * Database health check utilities
 * Monitors Firestore connection and data consistency
 */

let lastHealthCheckTime = null;
let healthCheckInterval = 5 * 60 * 1000; // 5 minutes
let isHealthy = true;

export async function performHealthCheck() {
  try {
    const db = getDb();
    
    // Test basic connectivity with a simple query
    const startTime = Date.now();
    await db.collection("_health_check").limit(1).get();
    const duration = Date.now() - startTime;
    
    if (duration > 10000) {
      console.warn(`[Firestore Health] Slow health check: ${duration}ms`);
    }
    
    isHealthy = true;
    lastHealthCheckTime = new Date();
    return { status: "healthy", duration, timestamp: lastHealthCheckTime };
  } catch (error) {
    isHealthy = false;
    console.error("[Firestore Health] Health check failed:", error.message);
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
    const db = getDb();
    const issues = [];

    // Check for orphaned students (students in non-existent classes)
    const studentsSnap = await db.collection("students").select("classId").get();
    const classesSnap = await db.collection("classes").select().get();
    const validClassIds = new Set(classesSnap.docs.map(d => d.id));

    for (const studentDoc of studentsSnap.docs) {
      const classId = studentDoc.data().classId;
      if (classId && !validClassIds.has(classId)) {
        issues.push({
          type: "ORPHANED_STUDENT",
          studentId: studentDoc.id,
          classId,
          severity: "high"
        });
      }
    }

    // Check for orphaned scores (scores for non-existent students/subjects)
    const scoresSnap = await db.collection("scores").select("studentId", "classId", "subjectId").get();
    const validStudentIds = new Set(studentsSnap.docs.map(d => d.id));
    const subjectsSnap = await db.collection("subjects").select().get();
    const validSubjectIds = new Set(subjectsSnap.docs.map(d => d.id));

    for (const scoreDoc of scoresSnap.docs) {
      const { studentId, subjectId } = scoreDoc.data();
      if (!validStudentIds.has(studentId)) {
        issues.push({
          type: "ORPHANED_SCORE_STUDENT",
          scoreId: scoreDoc.id,
          studentId,
          severity: "high"
        });
      }
      if (subjectId && !validSubjectIds.has(subjectId)) {
        issues.push({
          type: "ORPHANED_SCORE_SUBJECT",
          scoreId: scoreDoc.id,
          subjectId,
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
    const db = getDb();
    const collections = ["students", "classes", "users", "scores", "subjects", "assignments"];
    const metrics = {};

    for (const collection of collections) {
      const snap = await db.collection(collection).count().get();
      metrics[collection] = snap.data().count;
    }

    return { timestamp: new Date(), metrics };
  } catch (error) {
    console.error("[Collection Metrics] Failed:", error);
    return { error: error.message };
  }
}
