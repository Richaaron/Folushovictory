import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import { SafeDatabase } from "../firestore-utils/index.js";

function scoreId({ session, term, classId, studentId, subjectId }) {
  return `${session}_${term}_${classId}_${studentId}_${subjectId}`;
}

export async function upsertNumericScore({ session, term, classId, studentId, subjectId, ca1, ca2, exam, enteredBy }) {
  const ref = getDb().collection("scores").doc(scoreId({ session, term, classId, studentId, subjectId }));
  return SafeDatabase.upsert("scores", ref.id, {
    session,
    term,
    classId,
    studentId,
    subjectId,
    type: "NUMERIC",
    ca1: Number(ca1 || 0),
    ca2: Number(ca2 || 0),
    ca: Number(ca1 || 0) + Number(ca2 || 0),
    exam: Number(exam || 0),
    enteredBy
  });
}

export async function upsertTraitScore({ session, term, classId, studentId, subjectId, rating, enteredBy }) {
  const ref = getDb().collection("scores").doc(scoreId({ session, term, classId, studentId, subjectId }));
  return SafeDatabase.upsert("scores", ref.id, {
    session,
    term,
    classId,
    studentId,
    subjectId,
    type: "TRAIT",
    rating,
    enteredBy
  });
}

export async function listScoresForClass({ session, term, classId }) {
  const { data } = await SafeDatabase.query(
    "scores",
    [],
    { pageSize: 1000 }
  );
  return data.filter((score) =>
    String(score.session) === String(session) &&
    String(score.term) === String(term) &&
    String(score.classId) === String(classId)
  );
}

export async function listScoresForStudent({ session, term, studentId }) {
  const { data } = await SafeDatabase.query(
    "scores",
    [],
    { pageSize: 1000 }
  );
  return data.filter((score) =>
    String(score.session) === String(session) &&
    String(score.term) === String(term) &&
    String(score.studentId) === String(studentId)
  );
}

