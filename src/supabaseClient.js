import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export supabase as a named export
export const supabase = createClient(supabaseUrl, supabaseAnonKey);