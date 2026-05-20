import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";
import { hashPassword } from "../src/security.js";
import { Roles } from "../src/constants.js";
import { generateStudentId, generateParentUsername } from "../src/ids.js";

assertConfig();

async function test() {
  const studentId = await generateStudentId();
  const parentUsername = await generateParentUsername();
  const parentPasswordHash = await hashPassword("password123");

  const studentPayload = {
    studentId,
    firstName: "TestFirst",
    lastName: "TestLast",
    gender: "Male",
    classId: "P2SWpXEL3F6lImacvkqU",
    parentName: "Test Parent",
    parentEmail: "testparent@example.com",
    stream: "Science",
    subjectIds: []
  };

  const parentUserPayload = {
    username: parentUsername,
    email: "testparent@example.com",
    portal: "PARENT",
    role: Roles.PARENT,
    displayName: "Test Parent",
    passwordHash: parentPasswordHash,
    studentId
  };

  try {
    console.log("Attempting to insert student...");
    const studentRes = await SafeDatabase.createWithValidation("students", studentPayload, "student", { checkDuplicates: false, docId: studentId });
    console.log("Student inserted successfully:", studentRes);

    console.log("Attempting to insert parent...");
    const parentRes = await SafeDatabase.createWithValidation("users", parentUserPayload, "user", { checkDuplicates: false, docId: parentUsername });
    console.log("Parent inserted successfully:", parentRes);
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

test().then(() => process.exit(0));
