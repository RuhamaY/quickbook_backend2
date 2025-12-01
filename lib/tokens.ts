// Token persistence and management
import { promises as fs } from "fs";
import { join } from "path";
import type { Tokens } from "@/types/models";
import { TOKENS_FILE } from "./config";
import { createSupabaseClient } from "./supabase";

// Always use ONLY server env vars for backend Supabase
function isSupabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// Use a fixed UUID for the single QuickBooks connection row
const QB_TOKEN_ROW_ID = "00000000-0000-0000-0000-000000000001";

// Supabase-based token storage
async function saveTokensToSupabase(tokens: Tokens): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("qb_tokens")
      .upsert(
        {
          id: QB_TOKEN_ROW_ID,
          tokens,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("❌ [SAVE TOKENS] Supabase error:", error);
      throw error;
    }

    console.log("✅ [SAVE TOKENS] Tokens saved to Supabase");
  } catch (error) {
    console.error("❌ [SAVE TOKENS] Failed:", error);
    throw error;
  }
}

async function loadTokensFromSupabase(): Promise<Tokens | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("qb_tokens")
      .select("tokens")
      .eq("id", QB_TOKEN_ROW_ID)
      .single();

    if (error) {
      console.log("ℹ️ [LOAD TOKENS] No tokens found in DB:", error.message);
      return null;
    }

    return data?.tokens || null;
  } catch (error) {
    console.error("❌ [LOAD TOKENS] Failed:", error);
    return null;
  }
}

// File fallback for local dev
function getTokensFilePath() {
  if (process.env.NODE_ENV === "production") return "/tmp/qb-tokens.json";
  return join(process.cwd(), TOKENS_FILE);
}

async function saveTokensToFile(tokens: Tokens): Promise<void> {
  const filePath = getTokensFilePath();
  await fs.writeFile(filePath, JSON.stringify(tokens, null, 2));
  console.log("💾 [LOCAL] Tokens saved to file");
}

async function loadTokensFromFile(): Promise<Tokens | null> {
  try {
    const filePath = getTokensFilePath();
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

// Public API
export async function saveTokens(tokens: Tokens): Promise<void> {
  if (isSupabaseConfigured()) return saveTokensToSupabase(tokens);
  return saveTokensToFile(tokens);
}

export async function loadTokens(): Promise<Tokens | null> {
  if (isSupabaseConfigured()) return loadTokensFromSupabase();
  return loadTokensFromFile();
}

export function basicAuthHeader(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export async function ensureTokens(): Promise<Tokens> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error("Not authorized yet. Visit /auth/start");
  if (!tokens.access_token || !tokens.realm_id)
    throw new Error("Tokens missing critical fields");

  return tokens;
}
