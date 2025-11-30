import { NextResponse } from "next/server";
import { getClientId, SCOPE, AUTH_BASE_URL, REDIRECT_URI } from "@/lib/config";

export async function GET() {
  // Read CLIENT_ID at runtime
  const clientId = getClientId();
  
  console.log("🔵 [AUTH START] Initiating OAuth flow...");
  console.log("🔵 [AUTH START] CLIENT_ID:", clientId ? `${clientId.substring(0, 10)}...` : "MISSING");
  console.log("🔵 [AUTH START] REDIRECT_URI:", REDIRECT_URI);
  console.log("🔵 [AUTH START] SCOPE:", SCOPE);
  console.log("🔵 [AUTH START] AUTH_BASE_URL:", AUTH_BASE_URL);
  console.log("🔵 [AUTH START] process.env.CLIENT_ID:", process.env.CLIENT_ID ? `${process.env.CLIENT_ID.substring(0, 10)}...` : "NOT IN PROCESS.ENV");

  if (!clientId) {
    console.error("❌ [AUTH START] ERROR: CLIENT_ID is missing!");
    console.error("❌ [AUTH START] Check .env.local file exists and contains CLIENT_ID");
    console.error("❌ [AUTH START] Make sure to restart the server after editing .env.local");
    return NextResponse.json(
      { 
        error: "CLIENT_ID is not configured. Please set it in .env.local",
        hint: "Restart the server after creating/editing .env.local"
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state: "random_state_123",
  });

  const url = `${AUTH_BASE_URL}?${params.toString()}`;
  console.log("🔵 [AUTH START] Redirecting to:", url);
  return NextResponse.redirect(url);
}


