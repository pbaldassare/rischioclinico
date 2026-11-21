import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://gzuaxqxtfqmhhoafbmhm.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dWF4cXh0ZnFtaGhvYWZibWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1OTgzMTYsImV4cCI6MjEwNjE3NDMxNn0.WrM9ae0W7vIt-q9CB33sHvyL-LSlY6RSbypje2fFx5s";

export const BUCKET_ALLEGATI = "rc-allegati";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: "rischio_clinico" },
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
