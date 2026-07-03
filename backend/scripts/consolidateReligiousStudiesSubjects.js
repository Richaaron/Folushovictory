import dotenv from "dotenv";
dotenv.config();

import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { getIdColumnName } from "../src/firestore-utils/db-utils.js";
import { isReligiousStudiesAlias, normalizeLevel, RELIGIOUS_STUDIES_NAME } from "../src/subjectAliases.js";

assertConfig();

async function queryAll(collectionName, constraints = []) {
  const idCol = getIdColumnName(collectionName);
  const data = [];
  let lastId = null;
  let hasMore = true;

  while (hasMore) {
    const queryConstraints = [...constraints];
    if (lastId !== null) queryConstraints.push([idCol, ">", lastId]);
    const result = await SafeDatabase.query(collectionName, queryConstraints, { pageSize: 1000 });
    data.push(...result.data);
    hasMore = result.hasMore;
    lastId = result.lastDoc?.[idCol] ?? null;
    if (!hasMore || result.data.length === 0) break;
  }

  return data;
}

function subjectGroupKey(subject) {
  const level = normalizeLevel(subject.level);
  const track = level === "SSS" ? (subject.track || "General") : "";
  return `${level}|${track}`;
}

function replaceIds(ids, idMap) {
  if (!Array.isArray(ids)) return ids;
  return [...new Set(ids.map((id) => idMap.get(id) || id).filter(Boolean))];
}

function scoreDocId(score, subjectId) {
  return `${score.session}_${score.term}_${score.classId}_${score.studentId}_${subjectId}`;
}

async function main() {
  const subjects = await queryAll("subjects");
  const religiousSubjects = subjects.filter((subject) =>
    subject.name === RELIGIOUS_STUDIES_NAME ||
    isReligiousStudiesAlias(subject.name)
  );

  if (religiousSubjects.length === 0) {
    console.log("No CRS/IRS or Religious Studies subject records found.");
    return;
  }

  const byGroup = new Map();
  for (const subject of religiousSubjects) {
    const key = subjectGroupKey(subject);
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(subject);
  }

  const idMap = new Map();
  const operations = [];
  const canonicalSubjects = [];

  for (const [key, groupSubjects] of byGroup.entries()) {
    const canonical =
      groupSubjects.find((subject) => subject.name === RELIGIOUS_STUDIES_NAME && !isReligiousStudiesAlias(subject.name)) ||
      groupSubjects[0];
    const [level, track] = key.split("|");

    canonicalSubjects.push(canonical);
    operations.push({
      type: "update",
      collectionName: "subjects",
      docId: canonical.id,
      data: {
        name: RELIGIOUS_STUDIES_NAME,
        level,
        track: level === "SSS" ? (track || "General") : (canonical.track || null),
        updatedAt: new Date().toISOString()
      }
    });

    for (const subject of groupSubjects) {
      idMap.set(subject.id, canonical.id);
      if (subject.id !== canonical.id) {
        operations.push({ type: "delete", collectionName: "subjects", docId: subject.id });
      }
    }
  }

  const [assignments, classes, students, registrationCodes, scores] = await Promise.all([
    queryAll("assignments"),
    queryAll("classes"),
    queryAll("students"),
    queryAll("registrationCodes"),
    queryAll("scores")
  ]);

  for (const assignment of assignments) {
    const newSubjectId = idMap.get(assignment.subjectId);
    if (newSubjectId && newSubjectId !== assignment.subjectId) {
      operations.push({
        type: "update",
        collectionName: "assignments",
        docId: assignment.id,
        data: { subjectId: newSubjectId, updatedAt: new Date().toISOString() }
      });
    }
  }

  for (const cls of classes) {
    const subjectIds = replaceIds(cls.subjectIds, idMap);
    if (Array.isArray(cls.subjectIds) && subjectIds.join("|") !== cls.subjectIds.join("|")) {
      operations.push({
        type: "update",
        collectionName: "classes",
        docId: cls.id,
        data: { subjectIds, updatedAt: new Date().toISOString() }
      });
    }
  }

  for (const student of students) {
    const subjectIds = replaceIds(student.subjectIds, idMap);
    if (Array.isArray(student.subjectIds) && subjectIds.join("|") !== student.subjectIds.join("|")) {
      operations.push({
        type: "update",
        collectionName: "students",
        docId: student.id || student.studentId,
        data: { subjectIds, updatedAt: new Date().toISOString() }
      });
    }
  }

  for (const code of registrationCodes) {
    const subjectIds = replaceIds(code.subjectIds, idMap);
    if (Array.isArray(code.subjectIds) && subjectIds.join("|") !== code.subjectIds.join("|")) {
      operations.push({
        type: "update",
        collectionName: "registrationCodes",
        docId: code.id || code.code,
        data: { subjectIds, updatedAt: new Date().toISOString() }
      });
    }
  }

  const canonicalScoreIds = new Set(scores.map((score) => score.id));
  for (const score of scores) {
    const newSubjectId = idMap.get(score.subjectId);
    if (!newSubjectId || newSubjectId === score.subjectId) continue;

    const newDocId = scoreDocId(score, newSubjectId);
    if (!canonicalScoreIds.has(newDocId)) {
      operations.push({
        type: "upsert",
        collectionName: "scores",
        docId: newDocId,
        data: { ...score, id: newDocId, subjectId: newSubjectId, updatedAt: new Date().toISOString() }
      });
      canonicalScoreIds.add(newDocId);
    }
    operations.push({ type: "delete", collectionName: "scores", docId: score.id });
  }

  if (operations.length === 0) {
    console.log("Religious Studies records are already consolidated.");
    return;
  }

  await SafeDatabase.batchWrite(operations);
  console.log(`Consolidated ${canonicalSubjects.length} Religious Studies subject group(s).`);
  console.log(`Applied ${operations.length} database operation(s).`);
}

main().catch((error) => {
  console.error("Failed to consolidate Religious Studies subjects:", error);
  process.exit(1);
});
