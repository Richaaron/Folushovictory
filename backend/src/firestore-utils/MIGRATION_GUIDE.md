/**
 * MIGRATION GUIDE: Updating Repositories to Use Firestore Robustness Layer
 * 
 * This guide shows how to update existing repository files to use the new
 * error handling, validation, and transaction utilities.
 */

// ============================================================
// BEFORE: Original implementation (error-prone)
// ============================================================
/*
export async function createStudent(student) {
  const db = getDb();
  const ref = db.collection("students").doc(student.studentId);
  await ref.create({
    ...student,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

ISSUES:
✗ No validation of input data
✗ No duplicate checking
✗ No error handling or retry logic
✗ No null/undefined checks
✗ Weak error messages
✗ No audit trail for failures
*/

// ============================================================
// AFTER: Using SafeDatabase (robust)
// ============================================================
/*
import { SafeDatabase } from "../firestore-utils/index.js";

export async function createStudent(student) {
  return SafeDatabase.createWithValidation(
    "students",
    student,
    "student"
  );
}

BENEFITS:
✓ Automatic input validation
✓ Duplicate detection
✓ Automatic retry on transient errors
✓ Proper error handling and classification
✓ User-friendly error messages
✓ Audit logging of failures
✓ Type checking and field validation
✓ Field length validation
*/

// ============================================================
// PATTERN 1: Create Operations
// ============================================================
/*
BEFORE:
export async function createClass(data) {
  const db = getDb();
  const formTeacherUsername = data.formTeacherUsername 
    ? String(data.formTeacherUsername).toLowerCase().trim() 
    : null;
  const ref = await db.collection("classes").add({
    ...data,
    formTeacherUsername,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

AFTER:
export async function createClass(data) {
  // Data is automatically sanitized and validated
  return SafeDatabase.createWithValidation(
    "classes",
    data,
    "class"
  );
}
*/

// ============================================================
// PATTERN 2: Update Operations
// ============================================================
/*
BEFORE:
export async function updateStudent(studentId, patch) {
  const db = getDb();
  const ref = db.collection("students").doc(studentId);
  await ref.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

ISSUES: No existence check before update, no error handling

AFTER:
export async function updateStudent(studentId, patch) {
  return SafeDatabase.updateWithValidation(
    "students",
    studentId,
    patch,
    "student"
  );
}

BENEFITS: Automatic existence check, timestamps, error handling
*/

// ============================================================
// PATTERN 3: Get Operations
// ============================================================
/*
BEFORE:
export async function getStudentById(studentId) {
  const db = getDb();
  const snap = await db.collection("students").doc(studentId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

AFTER:
export async function getStudentById(studentId) {
  try {
    return await SafeDatabase.getById("students", studentId);
  } catch (error) {
    // Handle 404 specifically if needed
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

BENEFITS: Better error handling, proper status codes
*/

// ============================================================
// PATTERN 4: List/Query Operations
// ============================================================
/*
BEFORE:
export async function listStudentsByClass(classId) {
  const db = getDb();
  const snap = await db.collection("students").where("classId", "==", classId).get();
  const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  students.sort((a, b) => String(a.lastName || "").localeCompare(String(b.lastName || "")));
  return students;
}

ISSUES: No pagination, can fail on large datasets, no error handling

AFTER:
export async function listStudentsByClass(classId, pageSize = 100) {
  const { data, hasMore } = await SafeDatabase.query(
    "students",
    [["classId", "==", classId]],
    { pageSize, orderBy: "lastName" }
  );
  return data;
}

BENEFITS: Pagination support, better performance, error handling
*/

// ============================================================
// PATTERN 5: Delete Operations
// ============================================================
/*
BEFORE:
export async function deleteStudent(studentId) {
  const db = getDb();
  await db.collection("students").doc(studentId).delete();
  return true;
}

ISSUES: No existence check, no validation, orphaned data risk

AFTER:
export async function deleteStudent(studentId) {
  return SafeDatabase.deleteWithValidation(
    "students",
    studentId,
    {
      validateBeforeDelete: async (student) => {
        // Prevent deleting students with scores
        const scoreCount = await SafeDatabase.count(
          "scores",
          [["studentId", "==", studentId]]
        );
        return {
          allowed: scoreCount === 0,
          reason: scoreCount > 0 
            ? `Cannot delete student with ${scoreCount} score records` 
            : null
        };
      }
    }
  );
}

BENEFITS: Data integrity checks, prevents orphaned records
*/

// ============================================================
// PATTERN 6: Transaction Operations
// ============================================================
/*
BEFORE:
export async function createStudentWithParent({ student, parentUser }) {
  const db = getDb();
  const studentRef = db.collection("students").doc(student.studentId);
  const parentRef = db.collection("users").doc(parentUser.username);

  await db.runTransaction(async (tx) => {
    const [studentSnap, parentSnap] = await Promise.all([
      tx.get(studentRef), 
      tx.get(parentRef)
    ]);
    if (studentSnap.exists) {
      throw new Error(`Student with ID ${student.studentId} already exists`);
    }
    if (parentSnap.exists) {
      throw new Error(`Parent username ${parentUser.username} already exists`);
    }

    tx.create(studentRef, { ...student, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.create(parentRef, { ...parentUser, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  });

  const studentSnap = await studentRef.get();
  return { id: studentSnap.id, ...studentSnap.data() };
}

ISSUES: No retry logic on transaction conflict

AFTER:
import { executeTransaction } from "../firestore-utils/transaction-helpers.js";

export async function createStudentWithParent({ student, parentUser }) {
  // Validate both documents first
  const validatedStudent = validateBeforeCreate(student, "student");
  const validatedParent = validateBeforeCreate(parentUser, "user");

  return executeTransaction(async (tx) => {
    const studentRef = getDb().collection("students").doc(validatedStudent.studentId);
    const parentRef = getDb().collection("users").doc(validatedParent.username);

    const [studentSnap, parentSnap] = await Promise.all([
      tx.get(studentRef),
      tx.get(parentRef)
    ]);

    if (studentSnap.exists) {
      throw new Error(`Student with ID ${validatedStudent.studentId} already exists`);
    }
    if (parentSnap.exists) {
      throw new Error(`Parent username ${validatedParent.username} already exists`);
    }

    tx.create(studentRef, { ...validatedStudent, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.create(parentRef, { ...validatedParent, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  });
}

BENEFITS: Automatic retry on conflicts, validation, better error handling
*/

// ============================================================
// PATTERN 7: Batch Operations
// ============================================================
/*
BEFORE:
export async function revokeFormTeacherStatus(username) {
  const db = getDb();
  const normalized = username ? String(username).toLowerCase().trim() : "";
  const snap = await db.collection("classes").where("formTeacherUsername", "==", normalized).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, { 
      formTeacherUsername: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
}

ISSUES: No error handling, no limits on batch size, no validation

AFTER:
import { executeBatch } from "../firestore-utils/transaction-helpers.js";

export async function revokeFormTeacherStatus(username) {
  const normalized = username ? String(username).toLowerCase().trim() : "";
  const classes = await SafeDatabase.query(
    "classes",
    [["formTeacherUsername", "==", normalized]],
    { pageSize: 500 }
  );

  return executeBatch(async (batch) => {
    for (const classDoc of classes.data) {
      const ref = getDb().collection("classes").doc(classDoc.id);
      batch.update(ref, {
        formTeacherUsername: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}

BENEFITS: Safe batch handling, pagination support, error handling
*/

// ============================================================
// PATTERN 8: Health Checks and Monitoring
// ============================================================
/*
// In your initialization or monitoring route
import { performHealthCheck, validateDataIntegrity } from "../firestore-utils/index.js";

adminRouter.get("/health/database", asyncHandler(async (req, res) => {
  const health = await performHealthCheck();
  const integrity = await validateDataIntegrity();
  
  res.json({
    database: health,
    dataIntegrity: integrity.status === "checked" ? integrity.issues : integrity
  });
}));
*/

// ============================================================
// MIGRATION CHECKLIST
// ============================================================
/*
□ Update all create operations to use SafeDatabase.createWithValidation()
□ Update all get operations to use SafeDatabase.getById()
□ Update all list/query operations to use SafeDatabase.query()
□ Update all update operations to use SafeDatabase.updateWithValidation()
□ Update all delete operations to use SafeDatabase.deleteWithValidation()
□ Add validation hooks to delete operations to check for orphaned data
□ Update transaction operations to use executeTransaction() with retry
□ Update batch operations to use executeBatch()
□ Add health check endpoints to admin routes
□ Test error recovery scenarios
□ Add logging/monitoring for database errors
*/

// ============================================================
// ERROR HANDLING IN ROUTES
// ============================================================
/*
The asyncHandler middleware will catch all errors from repository functions.
The error response will be formatted based on the error type:

VALIDATION_ERROR (400):
{
  "error": "Invalid input data",
  "details": ["Field firstName: exceeds max length of 100"]
}

CONFLICT_ERROR (409):
{
  "error": "This record already exists or was recently modified. Please refresh and try again."
}

NOT_FOUND_ERROR (404):
{
  "error": "Resource not found"
}

TRANSIENT_ERROR (503):
{
  "error": "Temporary service issue. Please try again.",
  "retryable": true
}

PERMISSION_ERROR (403):
{
  "error": "You don't have permission to perform this action"
}
*/

export {};
