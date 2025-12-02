import { NextResponse } from "next/server"
import { getStoredTokens } from "@/lib/quickbooks/token-store"

export async function GET() {
  try {
    const tokens = await getStoredTokens()

    if (!tokens) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      realm_id: tokens.realm_id,
      expires_at: tokens.created_at + tokens.expires_in * 1000,
    })
  } catch (error) {
    console.error("[v0] Token check error:", error)
    return NextResponse.json({ authenticated: false })
  }
}
