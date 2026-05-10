import admin from "firebase-admin";
import { config } from "./config.js";

let app;

export function getFirebaseApp() {
  if (app) return app;

  let credential;
  if (config.firebaseServiceAccountJson) {
    try {
      credential = admin.credential.cert(JSON.parse(config.firebaseServiceAccountJson));
    } catch (e) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON: " + e.message);
    }
  } else {
    credential = admin.credential.cert(config.googleCredentialsPath);
  }

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

