import { NextResponse } from "next/server";
import { ensureTokens } from "@/lib/tokens";
import { withRefresh, qboGetById } from "@/lib/qbo";
import { API_HOST, MINOR_VERSION } from "@/lib/config";

export async function GET() {
  console.log("📊 [COMPANY INFO] Fetching company information...");
  try {
    const tokens = await ensureTokens();

    const call = async (accessToken: string, realmId: string) => {
      const url = `${API_HOST}/v3/company/${realmId}/companyinfo/${realmId}`;
      console.log("📊 [COMPANY INFO] URL:", url);
      console.log("📊 [COMPANY INFO] Realm ID:", realmId);
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };
      const params = new URLSearchParams({ minorversion: MINOR_VERSION });
      return fetch(`${url}?${params.toString()}`, { headers });
    };

    const resp = await withRefresh(call, tokens);
    console.log("📊 [COMPANY INFO] Response status:", resp.status);

    if (!resp.ok) {
      const text = await resp.text();
      console.error("❌ [COMPANY INFO] Failed:", resp.status, text);
      return NextResponse.json(
        { error: text },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    console.log("✅ [COMPANY INFO] Success!");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ [COMPANY INFO] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch company info" },
      { status: 500 }
    );
  }
}

