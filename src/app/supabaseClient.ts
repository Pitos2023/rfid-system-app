// app/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

/**
 * 🔧 Environment variables
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Missing Supabase environment variables. Check your .env.local file."
  );
}

/**
 * 🧩 Default client (for general or non-role-specific use)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🧩 Role-based Supabase clients
 * Each client uses a different storage key in localStorage to isolate sessions.
 * This prevents logout actions from affecting other roles.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: "supabase-admin-session" },
});

export const supabaseGuard = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: "supabase-guard-session" },
});

export const supabaseParent = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: "supabase-parent-session" },
});

export const supabaseAssistant = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: "supabase-assistant-session" },
});

/**
 * 🧩 Helper: Dynamically get the correct client by role
 *
 * Example:
 * const supabase = createScopedClient("guard");
 */
export function createScopedClient(
  role: "admin" | "guard" | "parent" | "assistant_principal"
) {
  switch (role) {
    case "admin":
      return supabaseAdmin;
    case "guard":
      return supabaseGuard;
    case "parent":
      return supabaseParent;
    case "assistant_principal":
      return supabaseAssistant;
    default:
      return supabase;
  }
}
