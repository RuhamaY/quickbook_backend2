export interface QuickBooksTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  x_refresh_token_expires_in: number
  token_type: string
  realm_id: string
  created_at: number
}

export interface QuickBooksConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: "sandbox" | "production"
  scopes: string[]
  minorVersion: string
}

export interface QuickBooksEntity {
  Id: string
  [key: string]: any
}

export interface QueryResponse<T = any> {
  QueryResponse: {
    [entityType: string]: T[]
    startPosition?: number
    maxResults?: number
  }
}
