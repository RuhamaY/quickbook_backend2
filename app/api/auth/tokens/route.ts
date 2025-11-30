import { NextResponse } from "next/server";
import { loadTokens } from "@/lib/tokens";

export async function GET() {
  const tokens = await loadTokens();
  if (!tokens) {
    return NextResponse.json({ tokens: null });
  }

  const redacted = { ...tokens };
  if (redacted.access_token) {
    redacted.access_token = redacted.access_token.substring(0, 16) + "…";
  }
  if (redacted.refresh_token) {
    redacted.refresh_token = redacted.refresh_token.substring(0, 16) + "…";
  }

  return NextResponse.json({ tokens: redacted });
}


