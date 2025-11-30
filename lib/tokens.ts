// Token persistence and management
import { promises as fs } from "fs";
import { join } from "path";
import type { Tokens } from "@/types/models";
import { TOKENS_FILE } from "./config";

export async function saveTokens(tokens: Tokens): Promise<void> {
  const filePath = join(process.cwd(), TOKENS_FILE);
  console.log("💾 [SAVE TOKENS] Saving tokens to:", filePath);
  console.log("💾 [SAVE TOKENS] Token keys:", Object.keys(tokens));
  await fs.writeFile(filePath, JSON.stringify(tokens, null, 2), "utf-8");
  console.log("✅ [SAVE TOKENS] Tokens saved successfully");
}

export async function loadTokens(): Promise<Tokens | null> {
  try {
    const filePath = join(process.cwd(), TOKENS_FILE);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Tokens;
  } catch (error) {
    return null;
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
    console.error("❌ [ENSURE TOKENS] No tokens found in tokens.json");
    throw new Error("Not authorized yet. Hit /auth/start first.");
  }
  
  console.log("🔷 [ENSURE TOKENS] Tokens loaded, checking required fields...");
  console.log("🔷 [ENSURE TOKENS] Has access_token:", !!tokens.access_token);
  console.log("🔷 [ENSURE TOKENS] Has realm_id:", !!tokens.realm_id);
  console.log("🔷 [ENSURE TOKENS] Has refresh_token:", !!tokens.refresh_token);
  
  if (!tokens.access_token || !tokens.realm_id) {
    console.error("❌ [ENSURE TOKENS] Missing required fields");
    console.error("❌ [ENSURE TOKENS] Token keys:", Object.keys(tokens));
    throw new Error("tokens.json missing access_token or realm_id. Re-auth at /auth/start.");
  }
  
  console.log("✅ [ENSURE TOKENS] Tokens validated successfully");
  return tokens;
}


