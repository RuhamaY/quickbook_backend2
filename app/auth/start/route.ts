import { NextResponse } from "next/server"
import { generateAuthUrl } from "@/lib/quickbooks/auth"

function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function GET() {
  try {
    const state = generateState()
    const authUrl = generateAuthUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("[v0] Auth start error:", error)
    return NextResponse.json({ error: "Failed to start authentication" }, { status: 500 })
  }
}
