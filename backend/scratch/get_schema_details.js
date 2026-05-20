import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();
const { data: students } = await SafeDatabase.query("students", [], { pageSize: 1 });
const { data: users } = await SafeDatabase.query("users", [], { pageSize: 10 });
console.log("STUDENT RECORD:");
console.log(JSON.stringify(students[0], null, 2));
console.log("USER RECORDS:");
console.log(JSON.stringify(users.filter(u => u.role === "PARENT")[0] || users[0], null, 2));
process.exit(0);
