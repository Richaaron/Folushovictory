// Migration: Re-key scores that were saved under canonical "Religious Studies" ID (SYo7gWINpG0hHj2lIWv1)
// back to the actual IRS SSS ID (ilyOfETrDVEW5VjuxvUf) for entries made by IRS teacher (tch-2026-009).
// This is needed because the old code canonicalized the subjectId on save, causing IRS teacher's
// scores to be stored under the same key as the CRS teacher's scores.

import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const CANONICAL_ID = "SYo7gWINpG0hHj2lIWv1"; // Religious Studies (CRS SSS canonical)
  const IRS_ID = "ilyOfETrDVEW5VjuxvUf";        // IRS SSS

  // Find all scores saved by tch-2026-009 under the canonical ID
  const { data: scores } = await SafeDatabase.query("scores", [
    ["enteredBy", "==", "tch-2026-009"],
    ["subjectId", "==", CANONICAL_ID]
  ], { pageSize: 500 });

  console.log(`Found ${scores.length} scores by tch-2026-009 under canonical ID to migrate.`);
  
  for (const score of scores) {
    const oldId = `${score.session}_${score.term}_${score.classId}_${score.studentId}_${CANONICAL_ID}`;
    const newId = `${score.session}_${score.term}_${score.classId}_${score.studentId}_${IRS_ID}`;
    
    console.log(`  Migrating: ${oldId} -> ${newId}`);
    
    // Write new document with IRS ID
    await SafeDatabase.upsert("scores", newId, {
      ...score,
      subjectId: IRS_ID,
      id: newId
    });
    
    // Delete old document
    await SafeDatabase.delete("scores", oldId);
    
    console.log(`  Done.`);
  }
  
  console.log("\nMigration complete!");
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
