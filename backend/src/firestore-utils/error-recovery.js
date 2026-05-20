/**
 * Error classification, logging, and recovery strategies
 */

export const FirestoreErrorTypes = {
  TRANSIENT: "TRANSIENT", // Automatically retryable
  VALIDATION: "VALIDATION", // User input error
  NOT_FOUND: "NOT_FOUND", // Resource doesn't exist
  CONFLICT: "CONFLICT", // Data conflict (duplicate, race condition)
  PERMISSION: "PERMISSION", // Authorization issue
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED", // Rate limit or quota issue
  UNKNOWN: "UNKNOWN" // Unknown error
};

/**
 * Classify Firestore errors
 */
export function classifyFirestoreError(error) {
  // Transient errors - should retry
  if (
    error.code === "DEADLINE_EXCEEDED" ||
    error.code === "UNAVAILABLE" ||
    error.code === "RESOURCE_EXHAUSTED" ||
    error.code === "ABORTED" ||
    error.message?.includes("socket hang up") ||
    error.message?.includes("ECONNRESET")
  ) {
    return FirestoreErrorTypes.TRANSIENT;
  }

  // Validation errors
  if (
    error.statusCode === 400 ||
    error.message?.includes("Invalid argument") ||
    error.message?.includes("Validation failed")
  ) {
    return FirestoreErrorTypes.VALIDATION;
  }

  // Not found errors
  if (
    error.code === "NOT_FOUND" ||
    error.statusCode === 404
  ) {
    return FirestoreErrorTypes.NOT_FOUND;
  }

  // Conflict errors
  if (
    error.code === "ALREADY_EXISTS" ||
    error.message?.includes("already exists") ||
    error.message?.includes("duplicate") ||
    error.message?.includes("race condition")
  ) {
    return FirestoreErrorTypes.CONFLICT;
  }

  // Permission errors
  if (
    error.code === "PERMISSION_DENIED" ||
    error.statusCode === 403
  ) {
    return FirestoreErrorTypes.PERMISSION;
  }

  // Quota exceeded
  if (
    error.code === "RESOURCE_EXHAUSTED" ||
    error.message?.includes("Quota exceeded")
  ) {
    return FirestoreErrorTypes.QUOTA_EXCEEDED;
  }

  return FirestoreErrorTypes.UNKNOWN;
}

/**
 * Build error response with user-friendly message
 */
export function buildErrorResponse(error, errorType = null) {
  const type = errorType || classifyFirestoreError(error);

  const responses = {
    [FirestoreErrorTypes.TRANSIENT]: {
      message: "Temporary service issue. Please try again.",
      statusCode: 503,
      retryable: true
    },
    [FirestoreErrorTypes.VALIDATION]: {
      message: error.message || "Invalid input data",
      statusCode: 400,
      retryable: false,
      details: error.validationErrors
    },
    [FirestoreErrorTypes.NOT_FOUND]: {
      message: "Resource not found",
      statusCode: 404,
      retryable: false
    },
    [FirestoreErrorTypes.CONFLICT]: {
      message: "This record already exists or was recently modified. Please refresh and try again.",
      statusCode: 409,
      retryable: true
    },
    [FirestoreErrorTypes.PERMISSION]: {
      message: "You don't have permission to perform this action",
      statusCode: 403,
      retryable: false
    },
    [FirestoreErrorTypes.QUOTA_EXCEEDED]: {
      message: "Service is temporarily unavailable due to high demand. Please try again later.",
      statusCode: 429,
      retryable: true
    },
    [FirestoreErrorTypes.UNKNOWN]: {
      message: "An error occurred. Please try again.",
      statusCode: 500,
      retryable: false
    }
  };

  return responses[type] || responses[FirestoreErrorTypes.UNKNOWN];
}

/**
 * Logger for database errors
 */
export class DatabaseErrorLogger {
  static logError(operation, error, context = {}) {
    const errorType = classifyFirestoreError(error);
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      operation,
      errorType,
      errorCode: error.code,
      message: error.message,
      context,
      stack: error.stack
    };

    // Log severity based on error type
    if (errorType === FirestoreErrorTypes.TRANSIENT) {
      console.warn("[DB Error - Transient]", logEntry);
    } else if (errorType === FirestoreErrorTypes.VALIDATION) {
      console.warn("[DB Error - Validation]", logEntry);
    } else {
      console.error("[DB Error - Serious]", logEntry);
    }

    return logEntry;
  }

  static async logToDatabase(operation, error, context = {}) {
    // Legacy method - logging to console only (Firestore dependency removed)
    console.error("[DB Error Logger]", {
      type: "database_error",
      operation,
      errorType: classifyFirestoreError(error),
      errorMessage: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Retry strategies
 */
export function getRetryConfig(errorType, attempt = 1) {
  const config = {
    maxRetries: 0,
    delayMs: 0,
    backoffMultiplier: 1
  };

  switch (errorType) {
    case FirestoreErrorTypes.TRANSIENT:
      config.maxRetries = 5;
      config.delayMs = 100;
      config.backoffMultiplier = 2;
      break;
    case FirestoreErrorTypes.CONFLICT:
      config.maxRetries = 3;
      config.delayMs = 50;
      config.backoffMultiplier = 2;
      break;
    case FirestoreErrorTypes.QUOTA_EXCEEDED:
      config.maxRetries = 10;
      config.delayMs = 1000;
      config.backoffMultiplier = 1.5;
      break;
  }

  return config;
}

/**
 * Calculate backoff delay with jitter
 */
export function calculateBackoffDelay(attempt, baseDelayMs, multiplier) {
  const delay = baseDelayMs * Math.pow(multiplier, attempt - 1);
  const jitter = Math.random() * delay * 0.1; // 10% jitter
  return Math.min(delay + jitter, 60000); // Cap at 60 seconds
}

/**
 * Wrap operation with error handling and retry
 */
export async function withErrorHandling(
  operation,
  operationName = "database_operation",
  options = {}
) {
  let lastError;
  let attempt = 1;

  const maxAttempts = options.maxRetries ? options.maxRetries + 1 : 1;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorType = classifyFirestoreError(error);

      // Log the error
      DatabaseErrorLogger.logError(operationName, error, {
        attempt,
        maxAttempts,
        retryable: errorType === FirestoreErrorTypes.TRANSIENT ||
                   errorType === FirestoreErrorTypes.CONFLICT ||
                   errorType === FirestoreErrorTypes.QUOTA_EXCEEDED
      });

      // Check if retryable
      if (attempt < maxAttempts && shouldRetry(errorType)) {
        const retryConfig = getRetryConfig(errorType, attempt);
        const delayMs = calculateBackoffDelay(attempt, retryConfig.delayMs, retryConfig.backoffMultiplier);

        console.log(`[DB Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempt++;
        continue;
      }

      // Not retryable or max attempts reached
      throw buildErrorDetails(error, errorType);
    }
  }

  throw lastError;
}

function shouldRetry(errorType) {
  return [
    FirestoreErrorTypes.TRANSIENT,
    FirestoreErrorTypes.CONFLICT,
    FirestoreErrorTypes.QUOTA_EXCEEDED
  ].includes(errorType);
}

function buildErrorDetails(error, errorType) {
  const response = buildErrorResponse(error, errorType);
  const enhancedError = new Error(response.message);
  enhancedError.statusCode = response.statusCode;
  enhancedError.retryable = response.retryable;
  enhancedError.originalError = error;
  if (response.details) {
    enhancedError.details = response.details;
  }
  return enhancedError;
}
