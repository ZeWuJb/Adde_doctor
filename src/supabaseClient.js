import { createClient } from "@supabase/supabase-js"

// Ensure environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-supabase-url.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key"

// Check if environment variables are missing
if (supabaseUrl === "https://your-supabase-url.supabase.co" || supabaseAnonKey === "your-anon-key") {
  console.warn(
    "Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.",
  )
}

// Export supabase as a named export
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

