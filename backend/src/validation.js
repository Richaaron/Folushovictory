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
  return normalized.toLowerCase();
}

export function validateTeacherPayload(body) {
  const displayName = requiredString(body.displayName, "displayName");
  const email = validateEmail(body.email, false);
  const formClassId = optionalString(body.formClassId);
  return {
    displayName,
    email,
    formClassId,
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
  const subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds.map(id => String(id).trim()).filter(Boolean) : [];

  return {
    firstName,
    lastName,
    classId,
    parentName,
    gender,
    stream,
    parentEmail,
    subjectIds
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
  if (body.subjectIds !== undefined) patch.subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds.map(id => String(id).trim()).filter(Boolean) : [];
  if (Object.keys(patch).length === 0) {
    throw new ValidationError("No updatable student fields provided");
  }
  return patch;
}

export function validateTeacherRegistration(body) {
  const email = validateEmail(body.email, true);
  const password = requiredString(body.password, "password");
  const displayName = requiredString(body.displayName, "displayName");
  const registrationCode = requiredString(body.registrationCode, "registrationCode");

  if (password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long");
  }

  // Validate registration code format: tch-2026-NNN
  const normalizedCode = String(registrationCode).trim().toLowerCase();
  const codeRegex = /^tch-2026-\d{3}$/;
  if (!codeRegex.test(normalizedCode)) {
    throw new ValidationError("Invalid registration code format. Expected format: tch-2026-NNN (e.g., tch-2026-001)");
  }

  return {
    email,
    password,
    displayName,
    registrationCode: normalizedCode,
    portal: "TEACHER",
    role: Roles.TEACHER
  };
}
