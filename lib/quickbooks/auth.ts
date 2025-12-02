import "server-only"
import { getQuickBooksConfig, QBO_API_BASE, QBO_AUTH_BASE } from "./config"
import { getStoredTokens, storeTokens } from "./token-store"
import type { QuickBooksTokens } from "./types"

export function generateAuthUrl(state: string): string {
  const config = getQuickBooksConfig()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    response_type: "code",
    state,
  })

  return `${QBO_AUTH_BASE}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<QuickBooksTokens> {
  const config = getQuickBooksConfig()
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")

  const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${await response.text()}`)
  }

  const data = await response.json()
  const tokens: QuickBooksTokens = {
    ...data,
    created_at: Date.now(),
  }

  await storeTokens(tokens)
  return tokens
}

export async function refreshAccessToken(refreshToken: string): Promise<QuickBooksTokens> {
  const config = getQuickBooksConfig()
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")

  const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`)
  }

  const data = await response.json()
  const tokens: QuickBooksTokens = {
    ...data,
    created_at: Date.now(),
  }

  await storeTokens(tokens)
  return tokens
}

export async function getValidAccessToken(): Promise<string | null> {
  let tokens = await getStoredTokens()
  if (!tokens) return null

  const now = Date.now()
  const tokenAge = now - tokens.created_at
  const expiresIn = tokens.expires_in * 1000

  if (tokenAge >= expiresIn - 300000) {
    try {
      tokens = await refreshAccessToken(tokens.refresh_token)
    } catch (error) {
      console.error("[v0] Token refresh failed:", error)
      return null
    }
  }

  return tokens.access_token
}

export async function makeQuickBooksRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    throw new Error("Not authenticated with QuickBooks")
  }

  const tokens = await getStoredTokens()
  if (!tokens?.realm_id) {
    throw new Error("No realm ID found")
  }

  const config = getQuickBooksConfig()
  const url = `${QBO_API_BASE}/${tokens.realm_id}/${endpoint}?minorversion=${config.minorVersion}`

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...options.headers,
    },
  })
}
