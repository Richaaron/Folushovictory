import admin from "firebase-admin";
import { getDb } from "../firebase.js";

/**
 * Safe transaction execution with retry logic and rollback support
 */

const MAX_TRANSACTION_RETRIES = 3;
const TRANSACTION_TIMEOUT_MS = 30000;

export class TransactionError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = "TransactionError";
    this.originalError = originalError;
  }
}

/**
 * Execute transaction with automatic retry on failure
 */
export async function executeTransaction(transactionFn, options = {}) {
  const maxRetries = options.maxRetries || MAX_TRANSACTION_RETRIES;
  const timeout = options.timeout || TRANSACTION_TIMEOUT_MS;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const db = getDb();
      return await Promise.race([
        db.runTransaction(transactionFn),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Transaction timeout")), timeout)
        )
      ]);
    } catch (error) {
      lastError = error;

      // Retryable errors
      if (
        error.code === "ABORTED" ||
        error.code === "DEADLINE_EXCEEDED" ||
        error.code === "UNAVAILABLE" ||
        error.message?.includes("Transaction conflict")
      ) {
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 100 + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // Non-retryable errors
      throw new TransactionError(
        `Transaction failed after ${attempt} attempts: ${error.message}`,
        error
      );
    }
  }

  throw new TransactionError(
    `Transaction failed after ${maxRetries} retries: ${lastError.message}`,
    lastError
  );
}

/**
 * Safe batch write with validation and rollback checks
 */
export async function executeBatch(batchFn, options = {}) {
  try {
    const db = getDb();
    const batch = db.batch();
    const operations = [];

    // Collect all operations in a safe wrapper
    const batchProxy = {
      set: (ref, data, options) => {
        operations.push({ type: "set", ref, data, options });
        batch.set(ref, data, options);
      },
      update: (ref, data) => {
        operations.push({ type: "update", ref, data });
        batch.update(ref, data);
      },
      delete: (ref) => {
        operations.push({ type: "delete", ref });
        batch.delete(ref);
      }
    };

    // Execute batch function
    await batchFn(batchProxy);

    // Pre-commit validation
    if (options.validate) {
      const validation = await options.validate(operations);
      if (!validation.valid) {
        throw new Error(`Batch validation failed: ${validation.reason}`);
      }
    }

    // Commit with timeout protection
    const timeout = options.timeout || 30000;
    await Promise.race([
      batch.commit(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Batch commit timeout")), timeout)
      )
    ]);

    return { success: true, operationCount: operations.length };
  } catch (error) {
    throw new TransactionError(`Batch execution failed: ${error.message}`, error);
  }
}

/**
 * Atomic read-modify-write for a single document
 */
export async function atomicUpdate(
  docRef,
  updateFn,
  options = {}
) {
  return executeTransaction(
    async (tx) => {
      const snapshot = await tx.get(docRef);
      const currentData = snapshot.data() || {};
      const newData = await updateFn(currentData);

      // Validate before update
      if (options.validate) {
        const validation = options.validate(currentData, newData);
        if (!validation.valid) {
          throw new Error(`Atomic update validation failed: ${validation.reason}`);
        }
      }

      tx.set(docRef, newData, { merge: true });
      return { previous: currentData, updated: newData };
    },
    options
  );
}

/**
 * Multi-document transaction with consistency checks
 */
export async function transactionWithRollback(operations, rollbackFn, options = {}) {
  const executedOps = [];

  try {
    return await executeTransaction(
      async (tx) => {
        for (const op of operations) {
          executedOps.push(op);

          if (op.type === "get") {
            await tx.get(op.ref);
          } else if (op.type === "set") {
            tx.set(op.ref, op.data, op.options);
          } else if (op.type === "update") {
            tx.update(op.ref, op.data);
          } else if (op.type === "delete") {
            tx.delete(op.ref);
          }
        }
      },
      options
    );
  } catch (error) {
    // Attempt rollback
    if (rollbackFn && executedOps.length > 0) {
      try {
        await rollbackFn(executedOps);
      } catch (rollbackError) {
        console.error("[Transaction] Rollback failed:", rollbackError);
        throw new TransactionError(
          `Transaction failed and rollback also failed: ${error.message}`,
          error
        );
      }
    }
    throw error;
  }
}

/**
 * Safe field increment/decrement
 */
export async function atomicIncrement(docRef, fieldName, delta = 1) {
  return executeTransaction((tx) => {
    tx.update(docRef, {
      [fieldName]: admin.firestore.FieldValue.increment(delta),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

/**
 * Atomic array operations
 */
export async function atomicArrayUnion(docRef, fieldName, elements) {
  const normalizedElements = Array.isArray(elements) ? elements : [elements];
  return executeTransaction((tx) => {
    tx.update(docRef, {
      [fieldName]: admin.firestore.FieldValue.arrayUnion(...normalizedElements),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

export async function atomicArrayRemove(docRef, fieldName, elements) {
  const normalizedElements = Array.isArray(elements) ? elements : [elements];
  return executeTransaction((tx) => {
    tx.update(docRef, {
      [fieldName]: admin.firestore.FieldValue.arrayRemove(...normalizedElements),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}
