/**
 * Data validation schemas and validators
 * Ensures data integrity before writes to Firestore
 */

export const ValidationSchemas = {
  student: {
    required: ["studentId", "firstName", "lastName", "classId"],
    types: {
      studentId: "string",
      firstName: "string",
      lastName: "string",
      classId: "string",
      email: "string",
      phone: "string",
      gender: "string",
      parentName: "string",
      parentEmail: "string",
      createdBy: "string"
    },
    maxLengths: {
      studentId: 50,
      firstName: 100,
      lastName: 100,
      classId: 50,
      email: 254,
      phone: 20,
      gender: 20,
      parentName: 150,
      parentEmail: 254,
      createdBy: 100
    }
  },

  class: {
    required: ["name", "level"],
    types: {
      name: "string",
      level: "string",
      formTeacherUsername: "string"
    },
    maxLengths: {
      name: 100,
      level: 50,
      formTeacherUsername: 100
    }
  },

  user: {
    required: ["username", "role"],
    types: {
      username: "string",
      role: "string",
      email: "string",
      displayName: "string",
      firstName: "string",
      lastName: "string",
      portal: "string",
      studentId: "string",
      formClassId: "string",
      signatureUrl: "string",
      passwordHash: "string"
    },
    maxLengths: {
      username: 100,
      role: 20,
      email: 254,
      displayName: 150,
      firstName: 100,
      lastName: 100,
      portal: 20,
      studentId: 50,
      formClassId: 50,
      signatureUrl: 2048,
      passwordHash: 200
    }
  },

  score: {
    required: ["session", "term", "classId", "studentId", "subjectId"],
    types: {
      session: ["string", "number"],
      term: ["string", "number"],
      classId: "string",
      studentId: "string",
      subjectId: "string",
      ca1: "number",
      ca2: "number",
      exam: "number",
      rating: "string",
      type: "string"
    },
    ranges: {
      ca1: { min: 0, max: 100 },
      ca2: { min: 0, max: 100 },
      exam: { min: 0, max: 100 }
    }
  },

  subject: {
    required: ["name", "level"],
    types: {
      name: "string",
      level: "string",
      category: "string"
    },
    maxLengths: {
      name: 100,
      level: 50,
      category: 50
    }
  },

  assignment: {
    required: ["teacherUsername", "classId", "subjectId"],
    types: {
      teacherUsername: "string",
      classId: "string",
      subjectId: "string"
    },
    maxLengths: {
      teacherUsername: 100,
      classId: 50,
      subjectId: 50
    }
  }
};

/**
 * Validate data against schema
 */
export function validateData(data, schemaKey) {
  const schema = ValidationSchemas[schemaKey];
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaKey}`);
  }

  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check types
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (data[field] === null || data[field] === undefined) continue;

      const expectedTypes = Array.isArray(expectedType) ? expectedType : [expectedType];
      const actualType = typeof data[field];
      
      if (!expectedTypes.includes(actualType)) {
        errors.push(`Field ${field}: expected ${expectedTypes.join(" or ")}, got ${actualType}`);
      }
    }
  }

  // Check max lengths
  if (schema.maxLengths) {
    for (const [field, maxLength] of Object.entries(schema.maxLengths)) {
      if (data[field] && String(data[field]).length > maxLength) {
        errors.push(`Field ${field}: exceeds max length of ${maxLength}`);
      }
    }
  }

  // Check ranges
  if (schema.ranges) {
    for (const [field, range] of Object.entries(schema.ranges)) {
      if (data[field] !== null && data[field] !== undefined) {
        const value = Number(data[field]);
        if (value < range.min || value > range.max) {
          errors.push(`Field ${field}: must be between ${range.min} and ${range.max}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize input data
 */
export function sanitizeData(data, type) {
  const sanitized = { ...data };

  // Trim strings
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitized[key].trim();
    }
  }

  // Normalize usernames
  if (type === "user" && sanitized.username) {
    sanitized.username = sanitized.username.toLowerCase().trim();
  }

  // Normalize class form teacher
  if (type === "class" && sanitized.formTeacherUsername) {
    sanitized.formTeacherUsername = sanitized.formTeacherUsername.toLowerCase().trim();
  }

  // Normalize assignment teacher username
  if (type === "assignment" && sanitized.teacherUsername) {
    sanitized.teacherUsername = sanitized.teacherUsername.toLowerCase().trim();
  }

  // Convert numeric scores
  if (type === "score") {
    if (sanitized.ca1 !== undefined) sanitized.ca1 = Number(sanitized.ca1) || 0;
    if (sanitized.ca2 !== undefined) sanitized.ca2 = Number(sanitized.ca2) || 0;
    if (sanitized.exam !== undefined) sanitized.exam = Number(sanitized.exam) || 0;
  }

  return sanitized;
}

/**
 * Validate before create
 */
export function validateBeforeCreate(data, type) {
  const sanitized = sanitizeData(data, type);
  const validation = validateData(sanitized, type);

  if (!validation.valid) {
    const error = new Error(`Validation failed for ${type}`);
    error.validationErrors = validation.errors;
    error.statusCode = 400;
    throw error;
  }

  return sanitized;
}

/**
 * Check for duplicate values
 */
export function buildDuplicateCheckRules(type) {
  const rules = {
    student: ["studentId"],
    class: ["name"],
    user: ["username"],
    subject: ["name"],
    assignment: []
  };
  return rules[type] || [];
}
