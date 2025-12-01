// Token persistence and management
import { promises as fs } from "fs";
import { join } from "path";
import type { Tokens } from "@/types/models";
import { TOKENS_FILE } from "./config";
import { createSupabaseClient } from "./supabase";

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL
  ) && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// Supabase-based token storage (for serverless/production)
async function saveTokensToSupabase(tokens: Tokens): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("qb_tokens")
      .upsert(
        {
          id: 1, // Single row for single QuickBooks connection
          tokens: tokens,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("❌ [SAVE TOKENS] Supabase error:", error);
      throw error;
    }
    console.log("✅ [SAVE TOKENS] Tokens saved to Supabase successfully");
  } catch (error: any) {
    console.error("❌ [SAVE TOKENS] Failed to save to Supabase:", error);
    throw error;
  }
}

async function loadTokensFromSupabase(): Promise<Tokens | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("qb_tokens")
      .select("tokens")
      .eq("id", 1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        console.log("ℹ️  [LOAD TOKENS] No tokens found in Supabase");
        return null;
      }
      console.error("❌ [LOAD TOKENS] Supabase error:", error);
      return null;
    }

    return data?.tokens as Tokens | null;
  } catch (error: any) {
    console.error("❌ [LOAD TOKENS] Failed to load from Supabase:", error);
    return null;
  }
}

// File-based token storage (fallback for local development)
function getTokensFilePath() {
  // In production (Vercel), use /tmp (writable but ephemeral)
  if (process.env.NODE_ENV === "production") {
    return "/tmp/qb-tokens.json";
  }

  // In local dev, keep using project root + TOKENS_FILE
  return join(process.cwd(), TOKENS_FILE);
}

async function saveTokensToFile(tokens: Tokens): Promise<void> {
  const filePath = getTokensFilePath();
  console.log("💾 [SAVE TOKENS] Saving tokens to file:", filePath);
  console.log("💾 [SAVE TOKENS] Token keys:", Object.keys(tokens));
  await fs.writeFile(filePath, JSON.stringify(tokens, null, 2), "utf-8");
  console.log("✅ [SAVE TOKENS] Tokens saved to file successfully");
}

async function loadTokensFromFile(): Promise<Tokens | null> {
  try {
    const filePath = getTokensFilePath();
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Tokens;
  } catch (error) {
    return null;
  }
}

// Main functions that use Supabase if available, otherwise fall back to file system
export async function saveTokens(tokens: Tokens): Promise<void> {
  console.log("💾 [SAVE TOKENS] Saving tokens...");
  console.log("💾 [SAVE TOKENS] Token keys:", Object.keys(tokens));

  if (isSupabaseConfigured()) {
    console.log("💾 [SAVE TOKENS] Using Supabase storage");
    await saveTokensToSupabase(tokens);
  } else {
    console.log("💾 [SAVE TOKENS] Using file system storage (Supabase not configured)");
    await saveTokensToFile(tokens);
  }
}

export async function loadTokens(): Promise<Tokens | null> {
  if (isSupabaseConfigured()) {
    console.log("📂 [LOAD TOKENS] Loading from Supabase...");
    return await loadTokensFromSupabase();
  } else {
    console.log("📂 [LOAD TOKENS] Loading from file system...");
    return await loadTokensFromFile();
  }
}


export function basicAuthHeader(clientId: string, clientSecret: string): string {
  const creds = `${clientId}:${clientSecret}`;
  return Buffer.from(creds).toString("base64");
}

export async function ensureTokens(): Promise<Tokens> {
  console.log("🔷 [ENSURE TOKENS] Loading tokens...");
  const tokens = await loadTokens();
  
  if (!tokens) {
    console.error("❌ [ENSURE TOKENS] No tokens found");
    throw new Error("Not authorized yet. Hit /auth/start first.");
  }
  
  console.log("🔷 [ENSURE TOKENS] Tokens loaded, checking required fields...");
  console.log("🔷 [ENSURE TOKENS] Has access_token:", !!tokens.access_token);
  console.log("🔷 [ENSURE TOKENS] Has realm_id:", !!tokens.realm_id);
  console.log("🔷 [ENSURE TOKENS] Has refresh_token:", !!tokens.refresh_token);
  
  if (!tokens.access_token || !tokens.realm_id) {
    console.error("❌ [ENSURE TOKENS] Missing required fields");
    console.error("❌ [ENSURE TOKENS] Token keys:", Object.keys(tokens));
    throw new Error("Tokens missing access_token or realm_id. Re-auth at /auth/start.");
  }
  
  console.log("✅ [ENSURE TOKENS] Tokens validated successfully");
  return tokens;
}

