import admin from "firebase-admin";
import { config } from "./config.js";

let app;

export function getFirebaseApp() {
  if (app) return app;

  let cert;
  if (config.firebaseServiceAccountJson) {
    try {
      // Remove surrounding quotes if present
      let jsonStr = config.firebaseServiceAccountJson.trim();
      
      // Handle potential double quoting from .env files
      if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
        jsonStr = jsonStr.slice(1, -1);
      }
      if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
        jsonStr = jsonStr.slice(1, -1);
      }
      
      const parsed = JSON.parse(jsonStr);
      cert = {
        ...parsed,
        private_key: parsed.private_key ? parsed.private_key.replace(/\\n/g, "\n") : undefined
      };
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON parse error:", e.message);
      console.error("Value was:", config.firebaseServiceAccountJson.substring(0, 50) + "...");
    }
  }

  const credential = cert 
    ? admin.credential.cert(cert) 
    : admin.credential.cert(config.googleCredentialsPath);

  app = admin.initializeApp({
    credential,
    projectId: config.firebaseProjectId
  });
  return app;
}

export function getDb() {
  getFirebaseApp();
  return admin.firestore();
}

