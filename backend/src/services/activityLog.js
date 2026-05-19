import { SafeDatabase } from "../firestore-utils/index.js";

export async function logActivity({ actor, role, action, details = {}, resourceType = "", resourceId = "" }) {
  const id = Math.random().toString(36).substring(2, 15);
  
  await SafeDatabase.upsert("activityLogs", id, {
    actor: String(actor),
    role: String(role),
    action: String(action),
    details,
    resourceType: String(resourceType || ""),
    resourceId: String(resourceId || "")
  });
  
  return id;
}
