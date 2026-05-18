import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { validateBeforeCreate, buildDuplicateCheckRules } from "./db-validation.js";
import { executeTransaction, executeBatch, atomicUpdate, atomicIncrement } from "./transaction-helpers.js";
import { withErrorHandling, DatabaseErrorLogger } from "./error-recovery.js";

/**
 * Safe database operations with built-in validation, error handling, and retry logic
 */

export class SafeDatabase {
  /**
   * Create document with validation and duplicate check
   */
  static async createWithValidation(
    collectionName,
    data,
    schemaKey,
    options = {}
  ) {
    return withErrorHandling(async () => {
      // Validate data
      const validated = validateBeforeCreate(data, schemaKey);

      // Check for duplicates if needed
      if (options.checkDuplicates !== false) {
        const duplicateFields = buildDuplicateCheckRules(schemaKey);
        for (const field of duplicateFields) {
          if (validated[field]) {
            const existing = await getDb()
              .collection(collectionName)
              .where(field, "==", validated[field])
              .limit(1)
              .get();

            if (!existing.empty) {
              const error = new Error(`${schemaKey} with ${field} "${validated[field]}" already exists`);
              error.statusCode = 409;
              throw error;
            }
          }
        }
      }

      // Create document
      return executeTransaction(async (tx) => {
        const docId = options.docId || getDb().collection(collectionName).doc().id;
        const ref = getDb().collection(collectionName).doc(docId);
        const dataWithTimestamp = {
          ...validated,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        tx.create(ref, dataWithTimestamp);

        // Return created document
        const snapshot = await ref.get();
        return { id: snapshot.id, ...snapshot.data() };
      });
    }, `create_${schemaKey}`);
  }

  /**
   * Update document with validation and timestamp
   */
  static async updateWithValidation(
    collectionName,
    docId,
    data,
    schemaKey = null,
    options = {}
  ) {
    return withErrorHandling(async () => {
      const ref = getDb().collection(collectionName).doc(docId);

      // Check existence
      const snapshot = await ref.get();
      if (!snapshot.exists) {
        const error = new Error(`${collectionName} document ${docId} not found`);
        error.statusCode = 404;
        throw error;
      }

      return atomicUpdate(ref, async () => {
        const currentData = snapshot.data() || {};
        const updateData = { ...data };

        // Add timestamp
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        return { ...currentData, ...updateData };
      });
    }, `update_${schemaKey || collectionName}`);
  }

  /**
   * Get document by ID with error handling
   */
  static async getById(collectionName, docId) {
    return withErrorHandling(async () => {
      const snapshot = await getDb()
        .collection(collectionName)
        .doc(docId)
        .get();

      if (!snapshot.exists) {
        const error = new Error(`${collectionName} document ${docId} not found`);
        error.statusCode = 404;
        throw error;
      }

      return { id: snapshot.id, ...snapshot.data() };
    }, `get_${collectionName}`);
  }

  /**
   * Query with pagination safety
   */
  static async query(
    collectionName,
    constraints = [],
    options = {}
  ) {
    return withErrorHandling(async () => {
      const pageSize = Math.min(options.pageSize || 100, 1000); // Cap at 1000
      let query = getDb().collection(collectionName);

      // Apply constraints
      for (const [field, operator, value] of constraints) {
        query = query.where(field, operator, value);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || "asc");
      }

      // Apply pagination
      query = query.limit(pageSize);
      if (options.startAfter) {
        query = query.startAfter(options.startAfter);
      }

      const snapshot = await query.get();
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      return {
        data: docs,
        pageSize: docs.length,
        hasMore: docs.length === pageSize,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
      };
    }, `query_${collectionName}`);
  }

  /**
   * Delete document with safety checks
   */
  static async deleteWithValidation(
    collectionName,
    docId,
    options = {}
  ) {
    return withErrorHandling(async () => {
      const ref = getDb().collection(collectionName).doc(docId);

      // Check existence
      const snapshot = await ref.get();
      if (!snapshot.exists) {
        const error = new Error(`${collectionName} document ${docId} not found`);
        error.statusCode = 404;
        throw error;
      }

      // Custom validation hook
      if (options.validateBeforeDelete) {
        const validation = await options.validateBeforeDelete(snapshot.data());
        if (!validation.allowed) {
          const error = new Error(validation.reason);
          error.statusCode = 400;
          throw error;
        }
      }

      return executeTransaction((tx) => {
        tx.delete(ref);
      });
    }, `delete_${collectionName}`);
  }

  /**
   * Batch operations with safety
   */
  static async batchWrite(operations, options = {}) {
    return withErrorHandling(async () => {
      return executeBatch(async (batch) => {
        for (const op of operations) {
          if (op.type === "set") {
            batch.set(op.ref, op.data, op.options);
          } else if (op.type === "update") {
            batch.update(op.ref, op.data);
          } else if (op.type === "delete") {
            batch.delete(op.ref);
          }
        }
      }, options);
    }, "batch_write");
  }

  /**
   * Increment field atomically
   */
  static async increment(
    collectionName,
    docId,
    fieldName,
    delta = 1
  ) {
    return withErrorHandling(async () => {
      const ref = getDb().collection(collectionName).doc(docId);
      return atomicIncrement(ref, fieldName, delta);
    }, `increment_${collectionName}`);
  }

  /**
   * Upsert with merge
   */
  static async upsert(
    collectionName,
    docId,
    data,
    options = {}
  ) {
    return withErrorHandling(async () => {
      const ref = getDb().collection(collectionName).doc(docId);

      return executeTransaction((tx) => {
        tx.set(
          ref,
          {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
      });
    }, `upsert_${collectionName}`);
  }

  /**
   * Check if document exists
   */
  static async exists(collectionName, docId) {
    return withErrorHandling(async () => {
      const snapshot = await getDb()
        .collection(collectionName)
        .doc(docId)
        .get();
      return snapshot.exists;
    }, `exists_${collectionName}`);
  }

  /**
   * Count documents
   */
  static async count(collectionName, constraints = []) {
    return withErrorHandling(async () => {
      let query = getDb().collection(collectionName);

      for (const [field, operator, value] of constraints) {
        query = query.where(field, operator, value);
      }

      const snapshot = await query.count().get();
      return snapshot.data().count;
    }, `count_${collectionName}`);
  }
}

export default SafeDatabase;
