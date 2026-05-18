import { Roles } from "./constants.js";

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

export function requiredString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`Missing or invalid ${name}`);
  }
  return value.trim();
}

export function optionalString(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new ValidationError(`Invalid string value`);
  }
  return value.trim();
}

export function normalizeUsername(value) {
  return requiredString(value, "username").toLowerCase();
}

export function validateEmail(value, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ValidationError("Missing email address");
    return null;
  }
  const normalized = String(value).trim();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(normalized)) {
    throw new ValidationError("Invalid email address");
  }
  return normalized;
}

export function validateTeacherPayload(body) {
  const displayName = requiredString(body.displayName, "displayName");
  const email = validateEmail(body.email, false);
  return {
    displayName,
    email,
    portal: "TEACHER",
    role: Roles.TEACHER
  };
}

export function validateStudentPayload(body) {
  const firstName = requiredString(body.firstName, "firstName");
  const lastName = requiredString(body.lastName, "lastName");
  const classId = requiredString(body.classId, "classId");
  const parentName = requiredString(body.parentName, "parentName");
  const gender = optionalString(body.gender) || "";
  const stream = optionalString(body.stream) || "";
  const parentEmail = validateEmail(body.parentEmail, false);

  return {
    firstName,
    lastName,
    classId,
    parentName,
    gender,
    stream,
    parentEmail
  };
}

export function validateStudentUpdatePayload(body) {
  const patch = {};
  if (body.firstName !== undefined) patch.firstName = requiredString(body.firstName, "firstName");
  if (body.lastName !== undefined) patch.lastName = requiredString(body.lastName, "lastName");
  if (body.classId !== undefined) patch.classId = requiredString(body.classId, "classId");
  if (body.parentName !== undefined) patch.parentName = requiredString(body.parentName, "parentName");
  if (body.gender !== undefined) patch.gender = optionalString(body.gender) || "";
  if (body.stream !== undefined) patch.stream = optionalString(body.stream) || "";
  if (body.parentEmail !== undefined) patch.parentEmail = validateEmail(body.parentEmail, false);
  if (Object.keys(patch).length === 0) {
    throw new ValidationError("No updatable student fields provided");
  }
  return patch;
}
