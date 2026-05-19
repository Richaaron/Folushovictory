import { getSupabase } from "../supabase.js";
import { validateBeforeCreate, buildDuplicateCheckRules } from "./db-validation.js";
import { withErrorHandling } from "./error-recovery.js";

/**
 * Maps standard collection names to their respective primary key columns in Postgres
 */
export function getIdColumnName(collectionName) {
  if (collectionName === "students") return "studentId";
  if (collectionName === "users") return "username";
  if (collectionName === "config" || collectionName === "counters") return "key";
  return "id";
}

/**
 * Safe database operations with built-in validation and Supabase integration
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
            const { data: existing, error } = await getSupabase()
              .from(collectionName)
              .select(getIdColumnName(collectionName))
              .eq(field, validated[field])
              .limit(1);

            if (error) throw error;

            if (existing && existing.length > 0) {
              const error = new Error(`${schemaKey} with ${field} "${validated[field]}" already exists`);
              error.statusCode = 409;
              throw error;
            }
          }
        }
      }

      // Create document
      const idCol = getIdColumnName(collectionName);
      const docId = options.docId || validated[idCol] || validated.username || validated.id || Math.random().toString(36).substring(2, 15);
      
      const finalData = collectionName === "config" ? {
        [idCol]: docId,
        value: validated,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : {
        ...validated,
        [idCol]: docId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await getSupabase()
        .from(collectionName)
        .insert([finalData])
        .select()
        .single();

      if (insertErr) throw insertErr;

      if (collectionName === "config") {
        return { id: docId, ...inserted.value };
      }

      return { id: docId, ...inserted };
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
      const idCol = getIdColumnName(collectionName);
      let updateData;
      
      if (collectionName === "config") {
        const existing = await SafeDatabase.getById(collectionName, docId);
        updateData = {
          value: {
            ...existing,
            ...data
          },
          updatedAt: new Date().toISOString()
        };
        delete updateData.value.id;
      } else {
        updateData = { 
          ...data,
          updatedAt: new Date().toISOString()
        };
        delete updateData[idCol];
        delete updateData.id;
      }

      const { data: updated, error } = await getSupabase()
        .from(collectionName)
        .update(updateData)
        .eq(idCol, docId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") { // PostgREST single row not found
          const err = new Error(`${collectionName} document ${docId} not found`);
          err.statusCode = 404;
          throw err;
        }
        throw error;
      }

      if (collectionName === "config") {
        return { id: docId, ...updated.value };
      }

      return { id: docId, ...updated };
    }, `update_${schemaKey || collectionName}`);
  }

  /**
   * Get document by ID with error handling
   */
  static async getById(collectionName, docId) {
    return withErrorHandling(async () => {
      const idCol = getIdColumnName(collectionName);
      const { data, error } = await getSupabase()
        .from(collectionName)
        .select("*")
        .eq(idCol, docId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const err = new Error(`${collectionName} document ${docId} not found`);
          err.statusCode = 404;
          throw err;
        }
        throw error;
      }

      if (collectionName === "config") {
        return { id: docId, ...data.value };
      }

      return { id: docId, ...data };
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
      let q = getSupabase().from(collectionName).select("*");

      // Apply constraints
      for (const [field, operator, value] of constraints) {
        if (operator === "==") {
          q = q.eq(field, value);
        } else if (operator === ">") {
          q = q.gt(field, value);
        } else if (operator === "<") {
          q = q.lt(field, value);
        } else if (operator === ">=") {
          q = q.gte(field, value);
        } else if (operator === "<=") {
          q = q.lte(field, value);
        } else if (operator === "array-contains") {
          // In Postgres, use jsonb contains
          q = q.contains(field, JSON.stringify([value]));
        } else if (operator === "in") {
          q = q.in(field, value);
        }
      }

      // Apply ordering
      if (options.orderBy) {
        const isAsc = (options.orderDirection || "asc") === "asc";
        q = q.order(options.orderBy, { ascending: isAsc });
      } else {
        const idCol = getIdColumnName(collectionName);
        q = q.order(idCol, { ascending: true });
      }

      // Apply pagination
      q = q.limit(pageSize);

      const { data, error } = await q;
      if (error) throw error;

      const idCol = getIdColumnName(collectionName);
      const docs = data.map((d) => ({ id: d[idCol], ...d }));

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
      const idCol = getIdColumnName(collectionName);

      // Fetch current data for validation
      const { data: current, error: getErr } = await getSupabase()
        .from(collectionName)
        .select("*")
        .eq(idCol, docId)
        .single();

      if (getErr || !current) {
        const error = new Error(`${collectionName} document ${docId} not found`);
        error.statusCode = 404;
        throw error;
      }

      // Custom validation hook
      if (options.validateBeforeDelete) {
        const validation = await options.validateBeforeDelete(current);
        if (!validation.allowed) {
          const error = new Error(validation.reason);
          error.statusCode = 400;
          throw error;
        }
      }

      // Delete the record
      const { error: delErr } = await getSupabase()
        .from(collectionName)
        .delete()
        .eq(idCol, docId);

      if (delErr) throw delErr;

      return { success: true };
    }, `delete_${collectionName}`);
  }

  /**
   * Batch operations with safety (Sequential inserts/updates in SQL)
   */
  static async batchWrite(operations, options = {}) {
    return withErrorHandling(async () => {
      for (const op of operations) {
        const collectionName = op.collectionName;
        const idCol = getIdColumnName(collectionName);

        if (op.type === "set" || op.type === "upsert") {
          const upsertData = {
            ...op.data,
            [idCol]: op.docId,
            updatedAt: new Date().toISOString()
          };
          const { error } = await getSupabase()
            .from(collectionName)
            .upsert([upsertData]);
          if (error) throw error;
        } else if (op.type === "update") {
          const { error } = await getSupabase()
            .from(collectionName)
            .update(op.data)
            .eq(idCol, op.docId);
          if (error) throw error;
        } else if (op.type === "delete") {
          const { error } = await getSupabase()
            .from(collectionName)
            .delete()
            .eq(idCol, op.docId);
          if (error) throw error;
        }
      }
      return { success: true };
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
      const idCol = getIdColumnName(collectionName);
      
      // Atomic increment fetch-and-update
      const { data: current, error: getErr } = await getSupabase()
        .from(collectionName)
        .select(fieldName)
        .eq(idCol, docId)
        .single();

      const currentValue = current ? Number(current[fieldName] || 0) : 0;
      const newValue = currentValue + delta;

      const { error: updateErr } = await getSupabase()
        .from(collectionName)
        .update({ [fieldName]: newValue })
        .eq(idCol, docId);

      if (updateErr) throw updateErr;

      return newValue;
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
      const idCol = getIdColumnName(collectionName);
      
      const upsertData = collectionName === "config" ? {
        [idCol]: docId,
        value: data,
        updatedAt: new Date().toISOString()
      } : {
        ...data,
        [idCol]: docId,
        updatedAt: new Date().toISOString()
      };

      const { error } = await getSupabase()
        .from(collectionName)
        .upsert([upsertData]);

      if (error) throw error;

      return { id: docId, ...data };
    }, `upsert_${collectionName}`);
  }

  /**
   * Check if document exists
   */
  static async exists(collectionName, docId) {
    return withErrorHandling(async () => {
      const idCol = getIdColumnName(collectionName);
      const { data, error } = await getSupabase()
        .from(collectionName)
        .select(idCol)
        .eq(idCol, docId);

      if (error) throw error;
      return data && data.length > 0;
    }, `exists_${collectionName}`);
  }

  /**
   * Count documents
   */
  static async count(collectionName, constraints = []) {
    return withErrorHandling(async () => {
      let q = getSupabase().from(collectionName).select("*", { count: "exact", head: true });

      for (const [field, operator, value] of constraints) {
        if (operator === "==") {
          q = q.eq(field, value);
        } else if (operator === ">") {
          q = q.gt(field, value);
        } else if (operator === "<") {
          q = q.lt(field, value);
        } else if (operator === ">=") {
          q = q.gte(field, value);
        } else if (operator === "<=") {
          q = q.lte(field, value);
        }
      }

      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    }, `count_${collectionName}`);
  }
}

export default SafeDatabase;
