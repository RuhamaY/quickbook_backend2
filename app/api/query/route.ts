import { NextRequest, NextResponse } from "next/server";
import { ensureTokens } from "@/lib/tokens";
import { withRefresh, qboQuery, respond } from "@/lib/qbo";

export async function GET(request: NextRequest) {
  console.log("🔍 [QUERY] Custom query request received");
  const searchParams = request.nextUrl.searchParams;
  const sql = searchParams.get("sql");

  if (!sql) {
    console.error("❌ [QUERY] Missing sql parameter");
    return NextResponse.json(
      { error: "Missing sql parameter" },
      { status: 400 }
    );
  }

  console.log("🔍 [QUERY] SQL:", sql);
  try {
    const tokens = await ensureTokens();
    const resp = await withRefresh(qboQuery, tokens, sql);
    return respond(resp);
  } catch (error: any) {
    console.error("❌ [QUERY] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Query failed" },
      { status: 500 }
    );
  }
}

