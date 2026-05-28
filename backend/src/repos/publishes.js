import { SafeDatabase } from "../firestore-utils/index.js";

function normalizeTerm(value) {
  const t = String(value || '').trim().toLowerCase();
  if (t === 'first' || t === 'first term' || t === '1') return '1st';
  if (t === 'second' || t === 'second term' || t === '2') return '2nd';
  if (t === 'third' || t === 'third term' || t === '3') return '3rd';
  if (['1st', '2nd', '3rd'].includes(t)) return t;
  return String(value || '').trim();
}

function publishId({ classId, session, term }) {
  const safeSession = String(session).replace(/\//g, '-');
  return `${safeSession}_${term}_${classId}`;
}

export async function isPublished({ classId, session, term }) {
  term = normalizeTerm(term);
  return SafeDatabase.exists("publishes", publishId({ classId, session, term }));
}

export async function publishResults({ classId, session, term, publishedBy }) {
  term = normalizeTerm(term);
  return SafeDatabase.upsert("publishes", publishId({ classId, session, term }), {
    classId,
    session,
    term,
    status: "PUBLISHED",
    publishedBy
  });
}

export async function getPublish({ classId, session, term }) {
  term = normalizeTerm(term);
  try {
    return await SafeDatabase.getById("publishes", publishId({ classId, session, term }));
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

