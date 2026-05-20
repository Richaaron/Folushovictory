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

async function run() {
  console.log("🚀 Attempting to apply SQL migration via exec_sql RPC...");
  
  const migrations = [
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`,
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentName" VARCHAR(150);`,
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentEmail" VARCHAR(254);`,
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS "createdBy" VARCHAR(100);`
  ];
  
  for (const sql of migrations) {
    try {
      console.log(`Executing SQL: ${sql}`);
      const { data, error } = await supabase.rpc("exec_sql", { query: sql });
      if (error) {
        console.error(`❌ RPC returned error: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ SQL Executed Successfully! Result:`, data);
      }
    } catch (err) {
      console.error(`❌ Direct script catch error:`, err.message);
    }
  }
  
  console.log("\n📊 Verification: Querying students table schema to see if columns are now visible...");
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    if (response.ok) {
      const spec = await response.json();
      const studentsDef = spec.definitions?.students || {};
      const columns = Object.keys(studentsDef.properties || {});
      console.log("Current Students Columns:", columns);
    } else {
      console.log("Failed to fetch API metadata for verification.");
    }
  } catch (err) {
    console.error("Verification failed:", err.message);
  }
  
  process.exit(0);
}

run();
