import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in configurations");
    }
    supabaseClient = createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }
  return supabaseClient;
}

export default getSupabase;
