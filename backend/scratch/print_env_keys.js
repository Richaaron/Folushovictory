import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("Environment keys:");
Object.keys(process.env).forEach(key => {
  if (key.includes("DB") || key.includes("POSTGRES") || key.includes("SQL") || key.includes("SUPABASE") || key.includes("URL") || key.includes("CONN")) {
    console.log(`- ${key}: ${process.env[key] ? "(has value)" : "(empty)"}`);
  } else {
    console.log(`- ${key}`);
  }
});
process.exit(0);
