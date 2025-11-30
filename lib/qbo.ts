// QuickBooks Online API helpers
import type { Tokens } from "@/types/models";
import { API_HOST, MINOR_VERSION, TOKEN_URL, getClientId, getClientSecret } from "./config";
import { basicAuthHeader, saveTokens, loadTokens } from "./tokens";

export async function exchangeCodeForTokens(code: string): Promise<Tokens> {
  // Read env vars at runtime
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  
  console.log("🟡 [TOKEN EXCHANGE] Starting token exchange...");
  console.log("🟡 [TOKEN EXCHANGE] TOKEN_URL:", TOKEN_URL);
  console.log("🟡 [TOKEN EXCHANGE] CLIENT_ID:", clientId ? `${clientId.substring(0, 10)}...` : "MISSING");
  console.log("🟡 [TOKEN EXCHANGE] CLIENT_SECRET:", clientSecret ? "***SET***" : "MISSING");
  console.log("🟡 [TOKEN EXCHANGE] Code length:", code.length);
  
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || "https://localhost:3000/auth/callback";
  console.log("🟡 [TOKEN EXCHANGE] Redirect URI:", redirectUri);

  if (!clientId || !clientSecret) {
    throw new Error("CLIENT_ID or CLIENT_SECRET is missing. Check your .env.local file.");
  }

  const headers = {
    Authorization: `Basic ${basicAuthHeader(clientId, clientSecret)}`,
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
  });

  console.log("🟡 [TOKEN EXCHANGE] Request body:", {
    grant_type: "authorization_code",
    code: `${code.substring(0, 10)}...`,
    redirect_uri: redirectUri,
  });

  try {
    console.log("🟡 [TOKEN EXCHANGE] Sending request to:", TOKEN_URL);
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers,
      body: params.toString(),
    });

    console.log("🟡 [TOKEN EXCHANGE] Response status:", response.status);
    console.log("🟡 [TOKEN EXCHANGE] Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ [TOKEN EXCHANGE] Failed with status:", response.status);
      console.error("❌ [TOKEN EXCHANGE] Response body:", text);
      throw new Error(`Token exchange failed: ${response.status} ${text}`);
    }

    const tokenData = await response.json();
    console.log("✅ [TOKEN EXCHANGE] Success! Token keys:", Object.keys(tokenData));
    return tokenData;
  } catch (error: any) {
    console.error("❌ [TOKEN EXCHANGE] Exception:", error);
    throw error;
  }
}

export async function refreshTokens(refreshToken: string): Promise<Tokens> {
  // Read env vars at runtime
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  
  console.log("🔄 [TOKEN REFRESH] Starting token refresh...");
  console.log("🔄 [TOKEN REFRESH] Refresh token length:", refreshToken.length);
  console.log("🔄 [TOKEN REFRESH] CLIENT_ID:", clientId ? `${clientId.substring(0, 10)}...` : "MISSING");
  console.log("🔄 [TOKEN REFRESH] CLIENT_SECRET:", clientSecret ? "***SET***" : "MISSING");
  
  if (!clientId || !clientSecret) {
    throw new Error("CLIENT_ID or CLIENT_SECRET is missing. Check your .env.local file.");
  }
  
  const headers = {
    Authorization: `Basic ${basicAuthHeader(clientId, clientSecret)}`,
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  try {
    console.log("🔄 [TOKEN REFRESH] Sending request to:", TOKEN_URL);
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers,
      body: params.toString(),
    });

    console.log("🔄 [TOKEN REFRESH] Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ [TOKEN REFRESH] Failed with status:", response.status);
      console.error("❌ [TOKEN REFRESH] Response body:", text);
      throw new Error(`Token refresh failed: ${response.status} ${text}`);
    }

    const tokenData = await response.json();
    console.log("✅ [TOKEN REFRESH] Success! Token keys:", Object.keys(tokenData));
    return tokenData;
  } catch (error: any) {
    console.error("❌ [TOKEN REFRESH] Exception:", error);
    throw error;
  }
}

export async function qboQuery(accessToken: string, realmId: string, sql: string) {
  const url = `${API_HOST}/v3/company/${realmId}/query`;
  console.log("🔵 [QBO QUERY] Executing query...");
  console.log("🔵 [QBO QUERY] URL:", url);
  console.log("🔵 [QBO QUERY] SQL:", sql);
  console.log("🔵 [QBO QUERY] Realm ID:", realmId);
  console.log("🔵 [QBO QUERY] Access token length:", accessToken.length);
  console.log("🔵 [QBO QUERY] Access token preview:", accessToken.substring(0, 20) + "...");

  const params = new URLSearchParams({
    query: sql,
    minorversion: MINOR_VERSION,
  });

  try {
    const fullUrl = `${url}?${params.toString()}`;
    console.log("🔵 [QBO QUERY] Full URL:", fullUrl);
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/text",
      },
    });

    console.log("🔵 [QBO QUERY] Response status:", response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error("❌ [QBO QUERY] Failed with status:", response.status);
      console.error("❌ [QBO QUERY] Response body:", text);
    } else {
      console.log("✅ [QBO QUERY] Success!");
    }
    return response;
  } catch (error: any) {
    console.error("❌ [QBO QUERY] Exception:", error);
    throw error;
  }
}

export async function qboGetById(accessToken: string, realmId: string, resource: string, entityId: string) {
  const url = `${API_HOST}/v3/company/${realmId}/${resource}/${entityId}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  const params = new URLSearchParams({
    minorversion: MINOR_VERSION,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "GET",
    headers,
  });

  return response;
}

export async function qboPost(accessToken: string, realmId: string, resource: string, body: Record<string, any>) {
  const url = `${API_HOST}/v3/company/${realmId}/${resource}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const params = new URLSearchParams({
    minorversion: MINOR_VERSION,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return response;
}

export async function withRefresh(
  requestFn: (accessToken: string, realmId: string, ...args: any[]) => Promise<Response>,
  tokens: Tokens,
  ...args: any[]
): Promise<Response> {
  console.log("🟣 [WITH REFRESH] Making API request...");
  console.log("🟣 [WITH REFRESH] Realm ID:", tokens.realm_id);
  console.log("🟣 [WITH REFRESH] Has access token:", !!tokens.access_token);
  console.log("🟣 [WITH REFRESH] Has refresh token:", !!tokens.refresh_token);

  let accessToken = tokens.access_token;
  let realmId = tokens.realm_id!;

  let resp = await requestFn(accessToken, realmId, ...args);
  console.log("🟣 [WITH REFRESH] Initial response status:", resp.status);

  // Check if response has 401 status and we have a refresh token
  if (resp.status === 401 && tokens.refresh_token) {
    console.log("🟣 [WITH REFRESH] Got 401, attempting token refresh...");
    const newTokens = await refreshTokens(tokens.refresh_token);
    newTokens.realm_id = realmId;
    await saveTokens(newTokens);
    console.log("🟣 [WITH REFRESH] Retrying request with new token...");
    resp = await requestFn(newTokens.access_token, realmId, ...args);
    console.log("🟣 [WITH REFRESH] Retry response status:", resp.status);
  }

  return resp;
}

export async function respond(resp: Response) {
  let data: any;
  try {
    data = await resp.json();
  } catch (error) {
    const text = await resp.text();
    throw new Error(`Response parsing failed: ${resp.status} ${text}`);
  }

  if (!resp.ok) {
    throw new Error(`API request failed: ${resp.status} ${JSON.stringify(data)}`);
  }

  return Response.json(data);
}

