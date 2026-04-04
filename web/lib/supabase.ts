import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export type UserRole = "member" | "admin" | "superadmin";

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  google_id: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}
