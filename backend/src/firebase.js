import admin from "firebase-admin";
import { config } from "./config.js";

let app;

export function getFirebaseApp() {
  if (app) return app;
  app = admin.initializeApp({
    credential: admin.credential.cert(config.googleCredentialsPath),
    projectId: config.firebaseProjectId
  });
  return app;
}

export function getDb() {
  getFirebaseApp();
  return admin.firestore();
}

