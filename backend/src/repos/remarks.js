import { SafeDatabase } from "../firestore-utils/index.js";

function remarkId({ session, term, studentId }) {
  return `${session}_${term}_${studentId}`;
}

export async function setTeacherRemark({ session, term, studentId, teacherRemark, setBy }) {
  return SafeDatabase.upsert("remarks", remarkId({ session, term, studentId }), {
    session,
    term,
    studentId,
    teacherRemarks: teacherRemark,
    teacherName: setBy ? String(setBy) : null
  });
}

export async function setPrincipalRemark({ session, term, studentId, principalRemark, setBy }) {
  return SafeDatabase.upsert("remarks", remarkId({ session, term, studentId }), {
    session,
    term,
    studentId,
    principalRemarks: principalRemark,
    principalName: setBy ? String(setBy) : null
  });
}

export async function listRemarksForStudents({ session, term, studentIds }) {
  if (!session || !term || !Array.isArray(studentIds) || studentIds.length === 0) return [];
  const { data } = await SafeDatabase.query(
    "remarks",
    [
      ["session", "==", session],
      ["term", "==", term],
      ["studentId", "in", studentIds]
    ],
    { pageSize: 1000 }
  );
  return data.map((entry) => ({
    ...entry,
    teacherRemark: entry.teacherRemarks || entry.teacherRemark || "",
    principalRemark: entry.principalRemarks || entry.principalRemark || ""
  }));
}

export async function getRemarks({ session, term, studentId }) {
  try {
    const data = await SafeDatabase.getById("remarks", remarkId({ session, term, studentId }));
    return {
      ...data,
      teacherRemark: data.teacherRemarks || data.teacherRemark || "",
      principalRemark: data.principalRemarks || data.principalRemark || ""
    };
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

