import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5000",
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL || "noreply@folushovictory.com",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  powerBiTenantId: process.env.POWERBI_TENANT_ID || "",
  powerBiClientId: process.env.POWERBI_CLIENT_ID || "",
  powerBiClientSecret: process.env.POWERBI_CLIENT_SECRET || "",
  powerBiWorkspaceId: process.env.POWERBI_WORKSPACE_ID || "",
  powerBiReportId: process.env.POWERBI_REPORT_ID || ""
};

export function assertConfig() {
  if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
  if (!config.supabaseUrl) throw new Error("Missing SUPABASE_URL");
  if (!config.supabaseServiceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}
