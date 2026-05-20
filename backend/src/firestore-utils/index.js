/**
 * Firestore Robustness Layer
 * 
 * This module provides comprehensive error handling, validation, transactions,
 * and monitoring for Firestore operations.
 * 
 * MODULES:
 * - db-health.js: Health checks and data consistency validation
 * - db-validation.js: Data validation schemas and sanitization
 * - transaction-helpers.js: Safe transaction execution with retry logic
 * - error-recovery.js: Error classification and recovery strategies
 * - db-utils.js: High-level safe database operations
 */

// Health monitoring
export { performHealthCheck, isFirestoreHealthy, validateDataIntegrity, getCollectionMetrics } from "./db-health.js";

// Data validation
export { ValidationSchemas, validateData, sanitizeData, validateBeforeCreate, buildDuplicateCheckRules } from "./db-validation.js";

// Transaction helpers (removed - Firebase Firestore transactions no longer used)

// Error handling and recovery
export { FirestoreErrorTypes, classifyFirestoreError, buildErrorResponse, DatabaseErrorLogger, getRetryConfig, calculateBackoffDelay, withErrorHandling } from "./error-recovery.js";

// Safe database operations
export { SafeDatabase, default } from "./db-utils.js";

/**
 * Quick start example:
 * 
 * import { SafeDatabase } from "./firestore-utils/index.js";
 * 
 * // Create with validation
 * const student = await SafeDatabase.createWithValidation(
 *   "students",
 *   { studentId: "S001", firstName: "John", lastName: "Doe", classId: "C1" },
 *   "student"
 * );
 * 
 * // Update with validation
 * const updated = await SafeDatabase.updateWithValidation(
 *   "students",
 *   "S001",
 *   { firstName: "Jane" },
 *   "student"
 * );
 * 
 * // Query with pagination
 * const { data, hasMore, lastDoc } = await SafeDatabase.query(
 *   "students",
 *   [["classId", "==", "C1"]],
 *   { pageSize: 50, orderBy: "lastName" }
 * );
 * 
 * // Get with error handling
 * const student = await SafeDatabase.getById("students", "S001");
 * 
 * // Delete with validation
 * await SafeDatabase.deleteWithValidation("students", "S001", {
 *   validateBeforeDelete: async (doc) => {
 *     const hasScores = await SafeDatabase.count("scores", [["studentId", "==", doc.id]]);
 *     return { 
 *       allowed: hasScores === 0, 
 *       reason: "Cannot delete student with scores" 
 *     };
 *   }
 * });
 * 
 * // Health checks
 * import { performHealthCheck, validateDataIntegrity } from "./firestore-utils/index.js";
 * 
 * const health = await performHealthCheck();
 * const integrity = await validateDataIntegrity();
 */
