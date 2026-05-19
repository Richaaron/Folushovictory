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
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || ""
};

export function assertConfig() {
  if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
  if (!config.firebaseProjectId) throw new Error("Missing FIREBASE_PROJECT_ID");
  if (!config.googleCredentialsPath && !config.firebaseServiceAccountJson) {
    throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON");
  }
}
