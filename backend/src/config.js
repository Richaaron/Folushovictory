import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5000"
};

export function assertConfig() {
  if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
  if (!config.firebaseProjectId) throw new Error("Missing FIREBASE_PROJECT_ID");
  if (!config.googleCredentialsPath) throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS");
}
