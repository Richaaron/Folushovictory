import { assertConfig } from "../src/config.js";
import { getFirebaseApp } from "../src/firebase.js";
import { getUserByUsername, createUser } from "../src/repos/users.js";
import { generateRandomPassword, hashPassword } from "../src/security.js";
import { Roles } from "../src/constants.js";

assertConfig();
getFirebaseApp();

const username = process.argv[2] || "admin";
const displayName = process.argv[3] || "School Admin";

const existing = await getUserByUsername(username);
if (existing) {
  process.stdout.write(`Admin user already exists: ${username}\n`);
  process.exit(0);
}

const password = generateRandomPassword(10);
const passwordHash = await hashPassword(password);

await createUser({
  username,
  portal: "ADMIN",
  role: Roles.ADMIN,
  displayName,
  passwordHash
});

process.stdout.write(`Created admin:\n`);
process.stdout.write(`  username: ${username}\n`);
process.stdout.write(`  password: ${password}\n`);
