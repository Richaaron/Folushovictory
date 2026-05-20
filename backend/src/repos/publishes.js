import { SafeDatabase } from "../firestore-utils/index.js";

function publishId({ classId, session, term }) {
  const safeSession = String(session).replace(/\//g, '-');
  return `${safeSession}_${term}_${classId}`;
}

export async function isPublished({ classId, session, term }) {
  return SafeDatabase.exists("publishes", publishId({ classId, session, term }));
}

export async function publishResults({ classId, session, term, publishedBy }) {
  return SafeDatabase.upsert("publishes", publishId({ classId, session, term }), {
    classId,
    session,
    term,
    status: "PUBLISHED",
    publishedBy
  });
}

export async function getPublish({ classId, session, term }) {
  try {
    return await SafeDatabase.getById("publishes", publishId({ classId, session, term }));
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

