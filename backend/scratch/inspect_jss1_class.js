import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const classId = "P2SWpXEL3F6lImacvkqU"; // JSS 1
  const cls = await SafeDatabase.getById("classes", classId);
  console.log("JSS 1 class doc:", JSON.stringify(cls, null, 2));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
