import { assertConfig } from '../src/config.js';
import { SafeDatabase } from '../src/firestore-utils/index.js';

console.log("🔍 Running Supabase Diagnostic Inspector...");

try {
  assertConfig();
  console.log("✅ Configuration assertions passed.");
} catch (error) {
  console.error("❌ Configuration check failed:", error.message);
  process.exit(1);
}

const collections = [
  'config',
  'counters',
  'users',
  'classes',
  'subjects',
  'students',
  'assignments',
  'scores',
  'remarks',
  'publishes',
  'releases',
  'activityLogs',
  'logs'
];

for (const collection of collections) {
  try {
    const count = await SafeDatabase.count(collection, []);
    console.log(`📡 Table "${collection}": ${count} records (Success)`);
  } catch (err) {
    console.error(`❌ Table "${collection}" inspect failed:`, err.message || err);
  }
}

console.log("\n🏁 Diagnostics completed!");
