// Supabase client for server-side operations
import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Supabase URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable."
    );
  }
  return url;
}

function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }
  return key;
}

// Create a Supabase client with service role key for server-side operations
// This bypasses RLS (Row Level Security) which is needed for server-side token storage
export function createSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseServiceKey();
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
