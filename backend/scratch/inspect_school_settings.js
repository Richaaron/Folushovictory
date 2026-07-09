import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const schoolSettings = await SafeDatabase.getById("config", "school");
  console.log("School settings:", JSON.stringify(schoolSettings, null, 2));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
