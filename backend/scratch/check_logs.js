import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: logs } = await SafeDatabase.query(
    "activityLogs",
    [["actor", "==", "tch-2026-009"]],
    { pageSize: 100, orderBy: "createdAt", orderDirection: "desc" }
  );
  
  console.log(`Found ${logs.length} activity logs for tch-2026-009:`);
  logs.forEach(l => {
    console.log(`Action: ${l.action} | Details: ${JSON.stringify(l.details)} | CreatedAt: ${l.createdAt}`);
  });
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
