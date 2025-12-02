import "server-only"
import { put, head } from "@vercel/blob"
import type { QuickBooksTokens } from "./types"

const TOKEN_BLOB_PATH = "quickbooks-tokens.json"

export async function getStoredTokens(): Promise<QuickBooksTokens | null> {
  try {
    const { url } = await head(TOKEN_BLOB_PATH)
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error("[v0] Failed to get stored tokens:", error)
    return null
  }
}

export async function storeTokens(tokens: QuickBooksTokens): Promise<void> {
  try {
    await put(TOKEN_BLOB_PATH, JSON.stringify(tokens), {
      access: "public",
      contentType: "application/json",
    })
  } catch (error) {
    console.error("[v0] Failed to store tokens:", error)
    throw error
  }
}
