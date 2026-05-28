import { SafeDatabase } from "../firestore-utils/index.js";

function normalizeTerm(value) {
  const t = String(value || '').trim().toLowerCase();
  if (t === 'first' || t === 'first term' || t === '1') return '1st';
  if (t === 'second' || t === 'second term' || t === '2') return '2nd';
  if (t === 'third' || t === 'third term' || t === '3') return '3rd';
  if (['1st', '2nd', '3rd'].includes(t)) return t;
  return String(value || '').trim();
}

function scoreId({ session, term, classId, studentId, subjectId }) {
  return `${session}_${term}_${classId}_${studentId}_${subjectId}`;
}

export async function upsertNumericScore({ session, term, classId, studentId, subjectId, ca1, ca2, exam, enteredBy }) {
  term = normalizeTerm(term);
  const customDocId = scoreId({ session, term, classId, studentId, subjectId });
  return SafeDatabase.upsert("scores", customDocId, {
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
  term = normalizeTerm(term);
  const customDocId = scoreId({ session, term, classId, studentId, subjectId });
  return SafeDatabase.upsert("scores", customDocId, {
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
  term = normalizeTerm(term);
  const { data } = await SafeDatabase.query(
    "scores",
    [
      ["session", "==", String(session)],
      ["term", "==", String(term)],
      ["classId", "==", String(classId)]
    ],
    { pageSize: 1000 }
  );
  return data;
}

export async function listScoresForStudent({ session, term, studentId }) {
  term = normalizeTerm(term);
  const { data } = await SafeDatabase.query(
    "scores",
    [
      ["session", "==", String(session)],
      ["term", "==", String(term)],
      ["studentId", "==", String(studentId)]
    ],
    { pageSize: 1000 }
  );
  return data;
}
