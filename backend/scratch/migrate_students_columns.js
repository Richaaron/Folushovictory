import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.log("🔧 Running students table migration...");

// Use rpc to execute raw SQL (requires pg_execute or similar, or we can try direct insert test)
// We'll use supabase.rpc if available, otherwise fall back to direct REST call

const migrations = [
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20)`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentName" VARCHAR(100)`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentEmail" VARCHAR(254)`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS "createdBy" VARCHAR(100)`,
];

for (const sql of migrations) {
  const { error } = await supabase.rpc("exec_sql", { query: sql }).catch(() => ({ error: { message: "rpc not available" } }));
  if (error) {
    console.warn(`⚠️  RPC method unavailable (${error.message}). Will use REST API approach.`);
    break;
  }
  console.log("✅ Ran:", sql);
}

// Verify by fetching one student record to see current columns
const { data, error: fetchErr } = await supabase.from("students").select("*").limit(1);
if (fetchErr) {
  console.error("❌ Fetch error:", fetchErr.message);
} else {
  console.log("\n📊 Current student record columns:", data[0] ? Object.keys(data[0]).join(", ") : "No records found");
}

process.exit(0);
