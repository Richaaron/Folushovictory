import { SafeDatabase } from "../firestore-utils/index.js";
import { getClassById } from "./classes.js";
import { listScoresForClass } from "./scores.js";
import { getSchoolSettings } from "./config.js";

function normalizeClassRef(value) {
  return String(value || "").trim().toLowerCase();
}

function buildClassMatchValues(classId, cls) {
  const values = new Set();
  const add = (value) => {
    if (!value) return;
    const trimmed = String(value).trim();
    if (!trimmed) return;
    values.add(trimmed.toLowerCase());
    values.add(trimmed.replace(/\s+/g, ""));
    values.add(trimmed.replace(/\s+/g, "-"));
    values.add(trimmed.replace(/\s+/g, "_"));
  };

  add(classId);
  add(cls?.id);
  add(cls?.name);
  add(cls?.className);
  add(cls?.classId);
  return Array.from(values);
}

function matchesClass(student, classMatchValues) {
  if (!student || !Array.isArray(classMatchValues) || classMatchValues.length === 0) return false;
  const studentClassRef = normalizeClassRef(student.classId);
  const studentClassNameRef = normalizeClassRef(student.className);
  const studentClassLabelRef = normalizeClassRef(student.classLabel);
  const studentStreamRef = normalizeClassRef(student.stream);
  const studentFormClassRef = normalizeClassRef(student.formClassId);
  return classMatchValues.some((value) => {
    const normalizedValue = normalizeClassRef(value);
    return (
      studentClassRef === normalizedValue ||
      studentClassNameRef === normalizedValue ||
      studentClassLabelRef === normalizedValue ||
      studentStreamRef === normalizedValue ||
      studentFormClassRef === normalizedValue
    );
  });
}

export async function createStudent(student) {
  return SafeDatabase.createWithValidation("students", student, "student", { checkDuplicates: true });
}

export async function createStudentWithParent({ student, parentUser, studentUser }) {
  const normalizedStudentId = String(student.studentId).toLowerCase().trim();
  const normalizedParentUsername = String(parentUser.username).toLowerCase().trim();
  const normalizedStudentUsername = normalizedStudentId;

  const existsStudent = await SafeDatabase.exists("students", normalizedStudentId);
  if (existsStudent) {
    const error = new Error(`Student with ID ${student.studentId} already exists`);
    error.statusCode = 409;
    throw error;
  }
  const existsParent = await SafeDatabase.exists("users", normalizedParentUsername);
  if (existsParent) {
    const error = new Error(`Parent username ${parentUser.username} already exists`);
    error.statusCode = 409;
    throw error;
  }
  if (studentUser && await SafeDatabase.exists("users", normalizedStudentUsername)) {
    const error = new Error(`Student account ${student.studentId} already exists`);
    error.statusCode = 409;
    throw error;
  }

  let studentCreated = false;
  let parentCreated = false;
  try {
    await SafeDatabase.createWithValidation("students", {
      ...student,
      studentId: normalizedStudentId
    }, "student", { checkDuplicates: false, docId: normalizedStudentId });
    studentCreated = true;

    await SafeDatabase.createWithValidation("users", {
      ...parentUser,
      username: normalizedParentUsername
    }, "user", { checkDuplicates: false, docId: normalizedParentUsername });
    parentCreated = true;

    if (studentUser) {
      await SafeDatabase.createWithValidation("users", {
        ...studentUser,
        username: normalizedStudentUsername,
        studentId: normalizedStudentId
      }, "user", { checkDuplicates: false, docId: normalizedStudentUsername });
    }
  } catch (error) {
    const rollback = [];
    if (parentCreated) rollback.push(SafeDatabase.deleteWithValidation("users", normalizedParentUsername));
    if (studentCreated) rollback.push(SafeDatabase.deleteWithValidation("students", normalizedStudentId));
    const results = await Promise.allSettled(rollback);
    results.forEach((result) => {
      if (result.status === "rejected") console.error("Failed to roll back student enrollment:", result.reason);
    });
    throw error;
  }

  return { success: true };
}

export async function listStudentsByClass(classId) {
  let data;
  const normalizedClassId = normalizeClassRef(classId);
  const cls = await getClassById(String(classId || "").trim()).catch(() => null);
  const classMatchValues = buildClassMatchValues(classId, cls);

  try {
    const result = await SafeDatabase.query(
      "students",
      [["classId", "==", classId]],
      { pageSize: 1000 }
    );
    data = result.data;
  } catch (error) {
    console.error("Class student query failed, falling back to in-memory filtering:", error?.message || error);
    const result = await SafeDatabase.query("students", [], { pageSize: 1000 });
    data = result.data.filter((student) => matchesClass(student, classMatchValues));
  }

  if (!Array.isArray(data) || data.length === 0) {
    const result = await SafeDatabase.query("students", [], { pageSize: 1000 });
    data = result.data.filter((student) => matchesClass(student, classMatchValues));
  }

  if (!Array.isArray(data)) {
    data = [];
  }

  if (data.length === 0 && normalizedClassId) {
    const result = await SafeDatabase.query("students", [], { pageSize: 1000 });
    data = result.data.filter((student) => {
      const refs = [student.classId, student.className, student.classLabel, student.stream, student.formClassId]
        .map((value) => normalizeClassRef(value))
        .filter(Boolean);
      return refs.some((ref) => ref === normalizedClassId || ref.includes(normalizedClassId) || normalizedClassId.includes(ref));
    });
  }

  return data.sort((a, b) => {
    const last = String(a.lastName || "").localeCompare(String(b.lastName || ""), undefined, { sensitivity: "base" });
    if (last !== 0) return last;
    const first = String(a.firstName || "").localeCompare(String(b.firstName || ""), undefined, { sensitivity: "base" });
    if (first !== 0) return first;
    return String(a.studentId || "").localeCompare(String(b.studentId || ""), undefined, { numeric: true });
  });
}

export async function countStudentsByClass(classId) {
  try {
    return await SafeDatabase.count("students", [["classId", "==", classId]]);
  } catch (error) {
    console.error("Student count query failed, falling back to filtered count:", error?.message || error);
  }

  const cls = await getClassById(String(classId || "").trim()).catch(() => null);
  const classMatchValues = buildClassMatchValues(classId, cls);
  const result = await SafeDatabase.query("students", [], { pageSize: 1000 });
  return result.data.filter((student) => matchesClass(student, classMatchValues)).length;
}

export async function getStudentById(studentId) {
  try {
    return await SafeDatabase.getById("students", studentId);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}


export async function updateStudent(studentId, patch) {
  const normalizedStudentId = String(studentId || "").toLowerCase().trim();
  return SafeDatabase.updateWithValidation("students", normalizedStudentId, patch, "student");
}

export async function deleteStudent(studentId) {
  const normalizedStudentId = String(studentId || "").toLowerCase().trim();
  
  // Cascade delete scores
  const { data: scores } = await SafeDatabase.query("scores", [["studentId", "==", normalizedStudentId]], { pageSize: 1000 });
  for (const score of scores) {
    await SafeDatabase.deleteWithValidation("scores", score.id);
  }
  
  // Assignments do not have a studentId, so we don't need to delete them here

  return SafeDatabase.deleteWithValidation("students", normalizedStudentId);
}

function getPreviousAcademicSession(session) {
  const match = String(session || "").trim().match(/^(\d{4})\/(\d{4})$/);
  if (!match) return "";
  return `${Number(match[1]) - 1}/${Number(match[2]) - 1}`;
}

/**
 * Returns all students who belong to a class for a given session+term.
 *
 * Strategy:
 * - If session matches CURRENT active school session (or is unassigned): return current class roster.
 * - For a PAST historical session: return students who had scores recorded in that class during that session.
 */
export async function listStudentsForSessionClass(classId, session, term) {
  const [currentStudents, schoolSettings, requestedClass] = await Promise.all([
    listStudentsByClass(classId).catch(() => []),
    getSchoolSettings(),
    getClassById(String(classId || "").trim()).catch(() => null)
  ]);

  const activeSession = String(schoolSettings?.currentSession || "").trim();
  const reqSession = String(session || "").trim();

  // For current active session (or empty session), return current class roster
  if (!reqSession || !activeSession || reqSession === activeSession) {
    return currentStudents;
  }

  // For a past/historical session, query scores to find students who were in this class.
  const { data: scores } = await SafeDatabase.query(
    "scores",
    [["session", "==", reqSession], ["classId", "==", String(classId)]],
    { pageSize: 1000 }
  );

  const scoreStudentIds = [...new Set((scores || []).map((s) => s.studentId))].filter(Boolean);

  if (scoreStudentIds.length > 0) {
    const historicalStudents = (
      await Promise.all(
        scoreStudentIds.map((id) => getStudentById(id).catch(() => null))
      )
    ).filter(Boolean);

    historicalStudents.sort((a, b) => {
      const last = String(a.lastName || "").localeCompare(String(b.lastName || ""), undefined, { sensitivity: "base" });
      if (last !== 0) return last;
      return String(a.firstName || "").localeCompare(String(b.firstName || ""), undefined, { sensitivity: "base" });
    });
    return historicalStudents;
  }

  if (
    /\bJSS\s*3\b/i.test(String(requestedClass?.name || "")) &&
    reqSession === getPreviousAcademicSession(activeSession)
  ) {
    const { data: classes } = await SafeDatabase.query("classes", [], { pageSize: 1000 });
    const promotedClass = classes.find((cls) => /\bSSS\s*1\b/i.test(String(cls.name || "")));
    if (promotedClass) return listStudentsByClass(promotedClass.id);
  }

  return [];
}
