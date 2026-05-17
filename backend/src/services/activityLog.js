import admin from "firebase-admin";
import { getDb } from "../firebase.js";

export async function logActivity({ actor, role, action, details = {}, resourceType = "", resourceId = "" }) {
  const db = getDb();
  const logRef = db.collection("activityLogs").doc();
  await logRef.set({
    actor: String(actor),
    role: String(role),
    action: String(action),
    details,
    resourceType: String(resourceType || ""),
    resourceId: String(resourceId || ""),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return logRef.id;
}
