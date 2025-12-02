import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/quickbooks/auth"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const realmId = searchParams.get("realmId")

  // Case 1: QuickBooks OAuth Callback (Requires code AND realmId)
  if (code && realmId) {
    try {
      const tokens = await exchangeCodeForTokens(code)

      return NextResponse.redirect(new URL("/?auth=success", request.url))
    } catch (error) {
      console.error("[v0] Auth callback error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }
  }

  // Fallback / Error
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}
