import { SafeDatabase } from "../firestore-utils/index.js";

function remarkId({ session, term, studentId }) {
  return `${session}_${term}_${studentId}`;
}

export async function setTeacherRemark({ session, term, studentId, teacherRemark, setBy }) {
  return SafeDatabase.upsert("remarks", remarkId({ session, term, studentId }), {
    session,
    term,
    studentId,
    teacherRemark,
    teacherRemarkBy: setBy
  });
}

export async function setPrincipalRemark({ session, term, studentId, principalRemark, setBy }) {
  return SafeDatabase.upsert("remarks", remarkId({ session, term, studentId }), {
    session,
    term,
    studentId,
    principalRemark,
    principalRemarkBy: setBy
  });
}

export async function getRemarks({ session, term, studentId }) {
  try {
    return await SafeDatabase.getById("remarks", remarkId({ session, term, studentId }));
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

