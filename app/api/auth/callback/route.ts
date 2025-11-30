import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/qbo";
import { saveTokens } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  console.log("🟢 [AUTH CALLBACK] OAuth callback received");
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("🟢 [AUTH CALLBACK] Query params:", {
    hasCode: !!code,
    codeLength: code?.length || 0,
    realmId: realmId || "MISSING",
    state: state || "MISSING",
    error: error || null,
    errorDescription: errorDescription || null,
  });

  if (error) {
    console.error("❌ [AUTH CALLBACK] OAuth error:", error, errorDescription);
    return NextResponse.json(
      { error: `OAuth error: ${error}`, description: errorDescription },
      { status: 400 }
    );
  }

  if (!code || !realmId) {
    console.error("❌ [AUTH CALLBACK] Missing required parameters");
    console.error("❌ [AUTH CALLBACK] Full URL:", request.url);
    return NextResponse.json(
      { error: "Missing code or realmId", receivedParams: Object.fromEntries(searchParams) },
      { status: 400 }
    );
  }

  try {
    console.log("🟢 [AUTH CALLBACK] Exchanging code for tokens...");
    const tokens = await exchangeCodeForTokens(code);
    console.log("🟢 [AUTH CALLBACK] Token exchange successful");
    console.log("🟢 [AUTH CALLBACK] Token response keys:", Object.keys(tokens));
    
    tokens.realm_id = realmId;
    console.log("🟢 [AUTH CALLBACK] Saving tokens with realm_id:", realmId);
    await saveTokens(tokens);
    console.log("🟢 [AUTH CALLBACK] Tokens saved successfully");

    return NextResponse.json({
      message: "Authorization successful",
      realm_id: realmId,
      scopes: tokens.scope,
    });
  } catch (error: any) {
    console.error("❌ [AUTH CALLBACK] Error during token exchange:", error);
    console.error("❌ [AUTH CALLBACK] Error message:", error.message);
    console.error("❌ [AUTH CALLBACK] Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Authorization failed", details: error.toString() },
      { status: 500 }
    );
  }
}


