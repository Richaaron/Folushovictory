# Firestore Robustness Layer

A comprehensive error handling, validation, and safety layer for Firestore operations.

## Overview

This module provides production-grade safety for Firestore operations by adding:

- **Automatic Error Handling & Retry**: Transient errors automatically retry with exponential backoff
- **Data Validation**: Schema-based validation with field type, length, and range checks
- **Duplicate Detection**: Prevents duplicate records before database writes
- **Safe Transactions**: Transaction wrappers with automatic retry and rollback support
- **Batch Safety**: Batch operations with size limits and error recovery
- **Data Integrity**: Detects orphaned records and referential integrity issues
- **Health Monitoring**: Periodic health checks and collection metrics
- **Audit Logging**: Complete error logging for debugging and compliance
- **User-Friendly Errors**: Error messages suitable for sending to frontend

## Architecture

### Modules

```
firestore-utils/
├── index.js                 # Main export and quick-start guide
├── db-health.js            # Health checks & data integrity validation
├── db-validation.js        # Data validation schemas & sanitization
├── transaction-helpers.js  # Safe transaction execution
├── error-recovery.js       # Error classification & recovery strategies
├── db-utils.js            # High-level safe database operations
└── MIGRATION_GUIDE.md     # How to update existing repositories
```

### Data Flow

```
User Request
    ↓
Validation (db-validation.js)
    ↓
Duplicate Check (db-validation.js)
    ↓
Database Operation (transaction-helpers.js)
    ↓
Error Occurs? → Error Classification (error-recovery.js)
    ↓ (retryable)
Retry with Backoff
    ↓
Success → Return with Timestamp
    ↓
Client Response
```

## Key Features

### 1. Automatic Validation

```javascript
import { SafeDatabase } from "./firestore-utils/index.js";

// Automatically validates against schema
const student = await SafeDatabase.createWithValidation(
  "students",
  { studentId: "S001", firstName: "John", lastName: "Doe", classId: "C1" },
  "student"
);

// Throws error with details if invalid:
// ValidationError: Field firstName exceeds max length of 100
```

### 2. Duplicate Prevention

```javascript
// Automatically checks for duplicates
// Will throw 409 Conflict if studentId already exists
const student = await SafeDatabase.createWithValidation(
  "students",
  studentData,
  "student",
  { checkDuplicates: true }
);
```

### 3. Automatic Retry

```javascript
// Transient errors (network, quota) automatically retry
// Maximum 5 retries with exponential backoff
// DEADLINE_EXCEEDED → retry
// UNAVAILABLE → retry
// RESOURCE_EXHAUSTED → retry
const result = await SafeDatabase.getById("students", "S001");
```

### 4. Safe Transactions

```javascript
import { executeTransaction } from "./firestore-utils/transaction-helpers.js";

// Automatic retry on transaction conflict
await executeTransaction(async (tx) => {
  tx.create(studentRef, studentData);
  tx.create(parentRef, parentData);
});

// Retries automatically if ABORTED
// Max 3 retries by default
```

### 5. Data Integrity Checks

```javascript
import { validateDataIntegrity } from "./firestore-utils/index.js";

const integrity = await validateDataIntegrity();
// Returns issues like:
// - Orphaned students (in non-existent classes)
// - Orphaned scores (for non-existent students)
// - Orphaned assignments
```

### 6. Health Monitoring

```javascript
import { performHealthCheck, getCollectionMetrics } from "./firestore-utils/index.js";

const health = await performHealthCheck();
// { status: "healthy", duration: 45ms, timestamp: Date }

const metrics = await getCollectionMetrics();
// { students: 150, classes: 12, users: 45, scores: 3200, ... }
```

## Usage Examples

### Create with Validation

```javascript
import { SafeDatabase } from "../firestore-utils/index.js";

export async function createStudent(student) {
  return SafeDatabase.createWithValidation(
    "students",
    student,
    "student"
  );
}
```

### Update with Timestamp

```javascript
export async function updateStudent(studentId, patch) {
  return SafeDatabase.updateWithValidation(
    "students",
    studentId,
    patch,
    "student"
  );
}
```

### Query with Pagination

```javascript
export async function listStudentsByClass(classId, pageSize = 100) {
  const { data, hasMore, lastDoc } = await SafeDatabase.query(
    "students",
    [["classId", "==", classId]],
    { pageSize, orderBy: "lastName" }
  );
  return data;
}
```

### Delete with Validation

```javascript
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
```

### Safe Transactions

```javascript
import { executeTransaction } from "../firestore-utils/transaction-helpers.js";

export async function createStudentWithParent({ student, parentUser }) {
  return executeTransaction(async (tx) => {
    const studentRef = getDb().collection("students").doc(student.studentId);
    const parentRef = getDb().collection("users").doc(parentUser.username);

    // Transaction automatically retries if conflicted
    tx.create(studentRef, { ...student, createdAt: FieldValue.serverTimestamp() });
    tx.create(parentRef, { ...parentUser, createdAt: FieldValue.serverTimestamp() });
  });
}
```

### Batch Operations

```javascript
import { executeBatch } from "../firestore-utils/transaction-helpers.js";

export async function revokeFormTeacherStatus(username) {
  const classes = await SafeDatabase.query(
    "classes",
    [["formTeacherUsername", "==", username]],
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
```

### Health Checks in Admin Routes

```javascript
import { performHealthCheck, validateDataIntegrity } from "../firestore-utils/index.js";

adminRouter.get("/health/database", asyncHandler(async (req, res) => {
  const health = await performHealthCheck();
  const integrity = await validateDataIntegrity();

  res.json({
    database: health,
    dataIntegrity: integrity
  });
}));
```

## Error Handling

The system classifies errors into types and provides appropriate responses:

| Error Type | HTTP Status | Retryable | Description |
|-----------|-----------|----------|------------|
| VALIDATION | 400 | No | Invalid input data |
| CONFLICT | 409 | Yes | Record already exists or race condition |
| NOT_FOUND | 404 | No | Resource doesn't exist |
| TRANSIENT | 503 | Yes | Network or quota issue |
| PERMISSION | 403 | No | Authorization failure |
| QUOTA_EXCEEDED | 429 | Yes | Rate limit hit |

### Error Response Example

```javascript
{
  "error": "This record already exists or was recently modified. Please refresh and try again.",
  "retryable": true,
  "statusCode": 409
}
```

## Validation Schemas

Built-in schemas validate:

- **student**: studentId, firstName, lastName, classId (required), email, phone
- **class**: name, level (required), formTeacherUsername
- **user**: username, role (required), email, firstName, lastName
- **score**: session, term, classId, studentId, subjectId (required), ca1/ca2/exam (0-100 range)
- **subject**: name, level (required), category

Add custom fields by updating `ValidationSchemas` in `db-validation.js`.

## Performance Considerations

- **Query Limits**: Maximum 1000 documents per query (enforced)
- **Batch Size**: Maximum 500 operations per batch (enforced)
- **Retry Limits**: 3-5 retries with exponential backoff (configurable)
- **Transaction Timeout**: 30 seconds (configurable)
- **Health Check**: 5 minute interval between checks

## Migration Path

1. See `MIGRATION_GUIDE.md` for step-by-step instructions
2. Start with one repository file (e.g., `students.js`)
3. Replace functions with `SafeDatabase` methods
4. Test error scenarios
5. Migrate remaining repositories
6. Add health check endpoint
7. Update frontend error handling

## Best Practices

1. **Always validate before create**: Use `createWithValidation()`
2. **Check existence before update**: `updateWithValidation()` does this
3. **Use pagination**: Don't fetch all documents
4. **Prevent orphans**: Add `validateBeforeDelete()` checks
5. **Monitor health**: Add periodic health check calls
6. **Log errors**: Use `DatabaseErrorLogger` for audit trail
7. **Test failures**: Test with network throttling and errors
8. **Update docs**: Document which operations are transactional

## Troubleshooting

### "Transaction conflict" errors
- Normal for concurrent writes, automatically retries
- If persistent, check for hot spots in data

### "Quota exceeded" errors
- Temporarily rate limited
- System automatically backs off and retries
- Consider increasing allocated throughput

### "Document not found" after update
- Check if document exists before updating
- Use `updateWithValidation()` which verifies existence

### Data integrity issues detected
- Use `validateDataIntegrity()` to find issues
- Update references manually or run cleanup scripts
- Add checks to prevent future issues

## Future Enhancements

- [ ] Automatic conflict resolution strategies
- [ ] Field-level encryption support
- [ ] Change data capture (CDC) for audit trail
- [ ] Time-series analytics for performance
- [ ] Automated backup/restore utilities
- [ ] Schema evolution helpers
- [ ] Performance profiling

## Support

For questions or issues:
1. Check MIGRATION_GUIDE.md
2. Review error logs in `_system_logs` collection
3. Run health check and data integrity validation
4. Check backend console for detailed error messages
