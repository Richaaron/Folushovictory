import { SafeDatabase } from "../firestore-utils/index.js";

function releaseId({ session, term, studentId }) {
  return `${session}_${term}_${studentId}`;
}

export async function setReleaseStatus({ session, term, studentId, released, releasedBy }) {
  const id = releaseId({ session, term, studentId });
  return SafeDatabase.upsert("releases", id, {
    session,
    term,
    studentId,
    released,
    releasedBy
  });
}

export async function getReleaseStatus({ session, term, studentId }) {
  try {
    const data = await SafeDatabase.getById("releases", releaseId({ session, term, studentId }));
    return { id: data.id, ...data };
  } catch (error) {
    if (error.statusCode === 404) {
      return { released: false };
    }
    throw error;
  }
}

export async function listReleasesForClass({ session, term, studentIds }) {
  if (!studentIds || studentIds.length === 0) return [];
  
  const { data: releases } = await SafeDatabase.query(
    "releases",
    [
      ["session", "==", session],
      ["term", "==", term]
    ],
    { pageSize: 1000 }
  );
  
  const map = {};
  releases.forEach(release => {
    if (studentIds.includes(release.studentId)) {
      map[release.studentId] = release.released;
    }
  });
  return map;
}
