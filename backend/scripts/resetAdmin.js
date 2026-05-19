import { assertConfig } from "../src/config.js";
import { getFirebaseApp } from "../src/firebase.js";
import { updateUser, getUserByUsername, createUser } from "../src/repos/users.js";
import { hashPassword } from "../src/security.js";
import { Roles } from "../src/constants.js";

async function resetAdmin() {
  assertConfig();
  getFirebaseApp();

  const username = "admin";
  const password = "Victory@2024";
  const passwordHash = await hashPassword(password);

  const existing = await getUserByUsername(username);
  if (existing) {
    await updateUser(username, { passwordHash, portal: "ADMIN", role: Roles.ADMIN });
    console.log("✅ Admin password reset to: " + password);
  } else {
    await createUser({
      username,
      portal: "ADMIN",
      role: Roles.ADMIN,
      displayName: "School Admin",
      passwordHash
    }, { docId: username });
    console.log("✅ Admin user created with password: " + password);
  }
  process.exit(0);
}

resetAdmin();
