import test from "node:test";
import assert from "node:assert/strict";
import { studentOffersSubject } from "../src/subjectRoster.js";

const scienceClass = { id: "sss-1", level: "SSS", track: "Science" };

test("includes a student explicitly enrolled in the subject", () => {
  assert.equal(
    studentOffersSubject(
      { subjectIds: ["physics-id"] },
      scienceClass,
      { id: "physics-id", name: "Physics", track: "Science" },
      ["physics-id"]
    ),
    true
  );
});

test("includes compulsory SSS core subjects for legacy records", () => {
  assert.equal(
    studentOffersSubject(
      { subjectIds: [] },
      scienceClass,
      { id: "math-id", name: "Mathematics" },
      ["math-id"]
    ),
    true
  );
});

test("uses the student's stream, not the class stream, for track subjects", () => {
  const physics = { id: "physics-id", name: "Physics", track: "Science" };
  assert.equal(studentOffersSubject({ subjectIds: [], stream: "Science" }, scienceClass, physics), true);
  assert.equal(studentOffersSubject({ subjectIds: [], stream: "Art" }, scienceClass, physics), false);
  assert.equal(studentOffersSubject({ subjectIds: [] }, scienceClass, physics), false);
});

test("does not assign unselected SSS electives to everyone", () => {
  assert.equal(
    studentOffersSubject({ subjectIds: [] }, scienceClass, { id: "elective-id", name: "Accounting" }),
    false
  );
});

test("requires explicit enrollment for lower-school Religious Studies aliases", () => {
  const cls = { id: "jss-1", level: "JSS" };
  const irs = { id: "irs-id", name: "IRS JSS" };
  const aliasIds = ["irs-id", "religious-id"];
  assert.equal(studentOffersSubject({ subjectIds: [] }, cls, irs, aliasIds), false);
  assert.equal(studentOffersSubject({ subjectIds: ["religious-id"] }, cls, irs, aliasIds), true);
});

test("preserves shared lower-school rosters for legacy records without subject selections", () => {
  const cls = { id: "jss-1", level: "JSS" };
  const english = { id: "english-id", name: "English Language" };
  assert.equal(studentOffersSubject({ subjectIds: [] }, cls, english), true);
  assert.equal(studentOffersSubject({ subjectIds: ["math-id"] }, cls, english), false);
});
