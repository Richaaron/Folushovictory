import admin from "firebase-admin";
import { config } from "./config.js";

let app;

export function getFirebaseApp() {
  if (app) return app;

  let cert;
  if (config.firebaseServiceAccountJson) {
    try {
      const parsed = JSON.parse(config.firebaseServiceAccountJson);
      cert = {
        ...parsed,
        private_key: parsed.private_key.replace(/\\n/g, "\n")
      };
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON parse error, falling back to file...");
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

