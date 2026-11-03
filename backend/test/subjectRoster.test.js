import test from "node:test";
import assert from "node:assert/strict";
import { studentOffersSubject } from "../src/subjectRoster.js";

const classRecord = { id: "sss-1", level: "SSS", track: "Science" };

 test("includes students with an explicit subject ID", () => {
  assert.equal(studentOffersSubject(
    { subjectIds: ["physics-id"] },
    classRecord,
    { id: "physics-id", name: "Physics", track: "Science" },
    ["physics-id"]
  ), true);
});

test("includes compulsory SSS core subjects even when legacy subjectIds are empty", () => {
  assert.equal(studentOffersSubject(
    { subjectIds: [] },
    classRecord,
    { id: "math-id", name: "Mathematics" },
    ["math-id"]
  ), true);
});

test("uses each student's stream rather than the class stream for track subjects", () => {
  const subject = { id: "physics-id", name: "Physics", track: "Science" };
  assert.equal(studentOffersSubject({ subjectIds: [], stream: "Science" }, classRecord, subject), true);
  assert.equal(studentOffersSubject({ subjectIds: [], stream: "Art" }, classRecord, subject), false);
  assert.equal(studentOffersSubject({ subjectIds: [] }, classRecord, subject), false);
});

test("does not assign unselected SSS electives to students with missing selections", () => {
  assert.equal(studentOffersSubject(
    { subjectIds: [] },
    classRecord,
    { id: "accounting-id", name: "Financial Accounting" }
  ), false);
});

test("requires explicit enrollment for lower-school Religious Studies variants", () => {
  assert.equal(studentOffersSubject(
    { subjectIds: [] },
    { id: "jss-1", level: "JSS" },
    { id: "irs-id", name: "IRS JSS" },
    ["irs-id", "religious-id"]
  ), false);
  assert.equal(studentOffersSubject(
    { subjectIds: ["religious-id"] },
    { id: "jss-1", level: "JSS" },
    { id: "irs-id", name: "IRS JSS" },
    ["irs-id", "religious-id"]
  ), true);
});

test("preserves shared lower-school class rosters for legacy records", () => {
  const cls = { id: "jss-1", level: "JSS" };
  const subject = { id: "english-id", name: "English Language" };
  assert.equal(studentOffersSubject({ subjectIds: [] }, cls, subject), true);
  assert.equal(studentOffersSubject({ subjectIds: ["math-id"] }, cls, subject), false);
});
