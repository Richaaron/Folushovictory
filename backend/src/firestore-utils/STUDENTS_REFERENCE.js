/**
 * REFERENCE IMPLEMENTATION: Updated Students Repository
 * 
 * This file shows the recommended patterns for using SafeDatabase utilities.
 * Compare with the original src/repos/students.js to see the improvements.
 * 
 * This is a reference file. To actually use it:
 * 1. Replace the imports in src/repos/students.js
 * 2. Update the functions gradually
 * 3. Test each function before moving to the next
 * 4. Remove this reference file
 */

import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { executeTransaction } from "../firestore-utils/transaction-helpers.js";

// ============================================================
// CREATE OPERATIONS
// ============================================================

/**
 * Create a single student with automatic validation
 */
export async function createStudent(student) {
  return SafeDatabase.createWithValidation(
    "students",
    student,
    "student",
    { checkDuplicates: true }
  );
}

/**
 * Create a student and parent in a single transaction
 * Automatically retries on transaction conflict
 */
export async function createStudentWithParent({ student, parentUser }) {
  return executeTransaction(async (tx) => {
    const studentRef = getDb().collection("students").doc(student.studentId);
    const parentRef = getDb().collection("users").doc(parentUser.username);

    // Get both documents to check existence
    const [studentSnap, parentSnap] = await Promise.all([
      tx.get(studentRef),
      tx.get(parentRef)
    ]);

    if (studentSnap.exists) {
      const error = new Error(`Student with ID ${student.studentId} already exists`);
      error.statusCode = 409;
      throw error;
    }
    if (parentSnap.exists) {
      const error = new Error(`Parent username ${parentUser.username} already exists`);
      error.statusCode = 409;
      throw error;
    }

    // Create both documents atomically
    tx.create(studentRef, {
      ...student,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    tx.create(parentRef, {
      ...parentUser,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * Get a single student by ID
 * Returns null if not found (for backward compatibility)
 */
export async function getStudentById(studentId) {
  try {
    return await SafeDatabase.getById("students", studentId);
  } catch (error) {
    // Return null for not found (backward compatible)
    if (error.statusCode === 404) {
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * List students in a class with pagination
 * Automatically handles sorting and error retry
 */
export async function listStudentsByClass(classId, pageSize = 100) {
  const { data } = await SafeDatabase.query(
    "students",
    [["classId", "==", classId]],
    {
      pageSize: Math.min(pageSize, 1000),
      orderBy: "lastName",
      orderDirection: "asc"
    }
  );
  return data;
}

/**
 * List students by class with pagination token support
 * Returns both data and pagination info
 */
export async function listStudentsByClassPaginated(classId, pageSize = 100, startAfter = null) {
  return SafeDatabase.query(
    "students",
    [["classId", "==", classId]],
    {
      pageSize: Math.min(pageSize, 1000),
      orderBy: "lastName",
      orderDirection: "asc",
      startAfter
    }
  );
}

/**
 * Check if a student exists
 */
export async function studentExists(studentId) {
  return SafeDatabase.exists("students", studentId);
}

/**
 * Count students in a class
 */
export async function countStudentsByClass(classId) {
  return SafeDatabase.count("students", [["classId", "==", classId]]);
}

// ============================================================
// UPDATE OPERATIONS
// ============================================================

/**
 * Update a student with automatic validation and timestamp
 * Checks existence before updating
 */
export async function updateStudent(studentId, patch) {
  return SafeDatabase.updateWithValidation(
    "students",
    studentId,
    patch,
    "student"
  );
}

/**
 * Update student's class assignment
 * Can be used to move students between classes
 */
export async function updateStudentClass(studentId, newClassId) {
  return SafeDatabase.updateWithValidation(
    "students",
    studentId,
    { classId: newClassId },
    "student"
  );
}

/**
 * Bulk update students (e.g., promote to next class)
 */
export async function bulkUpdateStudents(studentIds, updates) {
  // Query all students to be updated
  const db = getDb();
  const batch = db.batch();
  let operationCount = 0;

  for (const studentId of studentIds) {
    if (operationCount >= 500) {
      // Firestore batch limit
      console.warn("Batch update reached 500 operation limit");
      break;
    }

    const ref = db.collection("students").doc(studentId);
    batch.update(ref, {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    operationCount++;
  }

  await batch.commit();
  return { updated: operationCount };
}

// ============================================================
// DELETE OPERATIONS
// ============================================================

/**
 * Delete a student with validation
 * Prevents deletion if student has scores (data integrity)
 */
export async function deleteStudent(studentId) {
  return SafeDatabase.deleteWithValidation(
    "students",
    studentId,
    {
      validateBeforeDelete: async (student) => {
        // Check for related scores
        const scoreCount = await SafeDatabase.count(
          "scores",
          [["studentId", "==", studentId]]
        );

        if (scoreCount > 0) {
          return {
            allowed: false,
            reason: `Cannot delete student with ${scoreCount} score records. Delete scores first.`
          };
        }

        // Check for related assignments
        const assignmentCount = await SafeDatabase.count(
          "assignments",
          [["studentId", "==", studentId]]
        );

        if (assignmentCount > 0) {
          return {
            allowed: false,
            reason: `Cannot delete student with ${assignmentCount} assignments. Delete assignments first.`
          };
        }

        return { allowed: true, reason: null };
      }
    }
  );
}

/**
 * Soft delete (mark as inactive) instead of hard delete
 * Safer for data integrity
 */
export async function deactivateStudent(studentId) {
  return SafeDatabase.updateWithValidation(
    "students",
    studentId,
    { isActive: false },
    "student"
  );
}

/**
 * Reactivate a deactivated student
 */
export async function reactivateStudent(studentId) {
  return SafeDatabase.updateWithValidation(
    "students",
    studentId,
    { isActive: true },
    "student"
  );
}

// ============================================================
// SPECIAL OPERATIONS
// ============================================================

/**
 * Get student with all related data (class, subjects, scores)
 * Uses multiple safe queries
 */
export async function getStudentWithDetails(studentId) {
  // Get student
  const student = await SafeDatabase.getById("students", studentId);

  // Get class info
  const classInfo = student.classId
    ? await SafeDatabase.getById("classes", student.classId).catch(() => null)
    : null;

  // Get scores
  const { data: scores } = await SafeDatabase.query(
    "scores",
    [["studentId", "==", studentId]],
    { pageSize: 1000 }
  );

  return {
    student,
    class: classInfo,
    scores
  };
}

/**
 * Migrate students from one class to another
 * Atomic operation with validation
 */
export async function migrateStudentsToClass(studentIds, toClassId) {
  // Verify target class exists
  const targetClass = await SafeDatabase.getById("classes", toClassId);

  if (!targetClass) {
    const error = new Error(`Target class ${toClassId} does not exist`);
    error.statusCode = 404;
    throw error;
  }

  // Update all students
  return bulkUpdateStudents(studentIds, { classId: toClassId });
}

/**
 * Get students who haven't submitted scores for a term
 * Complex query with safety
 */
export async function getStudentsWithoutScores(classId, session, term) {
  // Get all students in class
  const { data: students } = await SafeDatabase.query(
    "students",
    [["classId", "==", classId]],
    { pageSize: 1000 }
  );

  // Get all students with scores for this term
  const { data: scoredStudents } = await SafeDatabase.query(
    "scores",
    [
      ["classId", "==", classId],
      ["session", "==", session],
      ["term", "==", term]
    ],
    { pageSize: 1000 }
  );

  const scoredIds = new Set(scoredStudents.map(s => s.studentId));

  // Filter students without scores
  return students.filter(s => !scoredIds.has(s.id));
}

// ============================================================
// EXPORT FOR REFERENCE
// ============================================================

/**
 * This reference implementation demonstrates:
 * 
 * ✓ Automatic validation before create
 * ✓ Duplicate detection
 * ✓ Automatic error retry on transient failures
 * ✓ Safe transactions with retry
 * ✓ Existence checking before update
 * ✓ Pagination support with limits
 * ✓ Data integrity checks before delete
 * ✓ Soft delete as alternative to hard delete
 * ✓ Error handling with proper HTTP status codes
 * ✓ Audit trail through logging
 * 
 * Migration steps:
 * 1. Import SafeDatabase in src/repos/students.js
 * 2. Replace functions one at a time
 * 3. Test each function individually
 * 4. Update related route handlers if needed
 * 5. Remove old implementations
 * 6. Add tests for error scenarios
 */
