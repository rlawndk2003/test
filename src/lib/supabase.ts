import { createClient } from "@supabase/supabase-js"

export const SUPABASE_URL = "https://<project>.supabase.co"
export const SUPABASE_ANON_KEY = "<anon key>"
export const IS_DEMO_MODE = SUPABASE_URL.includes("<project>")

// The valid fallback URL keeps the client constructible until students add credentials.
export const db = createClient(
  IS_DEMO_MODE ? "https://demo.supabase.co" : SUPABASE_URL,
  IS_DEMO_MODE ? "demo-anon-key" : SUPABASE_ANON_KEY,
)
