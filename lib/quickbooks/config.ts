import "server-only"
import type { QuickBooksConfig } from "./types"

export function getQuickBooksConfig(): QuickBooksConfig {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID || process.env.CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || process.env.CLIENT_SECRET
  const redirectUri =
    process.env.QUICKBOOKS_REDIRECT_URI ||
    process.env.QBO_REDIRECT_URI ||
    process.env.REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`

  if (!clientId || !clientSecret) {
    throw new Error("QuickBooks credentials not configured")
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    environment: "sandbox",
    scopes: (
      process.env.QUICKBOOKS_SCOPES ||
      process.env.QBO_SCOPES ||
      process.env.SCOPE ||
      "com.intuit.quickbooks.accounting"
    ).split(" "),
    minorVersion:
      process.env.QUICKBOOKS_MINOR_VERSION || process.env.QBO_MINOR_VERSION || process.env.MINOR_VERSION || "65",
  }
}

export const QBO_API_BASE = "https://sandbox-quickbooks.api.intuit.com/v3/company"
export const QBO_AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2"
