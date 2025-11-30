import { NextRequest, NextResponse } from "next/server";
import { ensureTokens } from "@/lib/tokens";
import { withRefresh, qboQuery, respond } from "@/lib/qbo";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");
  const prefix = searchParams.get("prefix") === "true";
  const max = parseInt(searchParams.get("max") || "1", 10);

  try {
    const tokens = await ensureTokens();
    const whereClauses: string[] = [];

    if (name) {
      if (prefix) {
        whereClauses.push(`DisplayName like '${name}%'`);
      } else {
        whereClauses.push(`DisplayName = '${name}'`);
      }
    }
    if (email) {
      whereClauses.push(`PrimaryEmailAddr.Address = '${email}'`);
    }
    if (phone) {
      whereClauses.push(`PrimaryPhone.FreeFormNumber = '${phone}'`);
    }

    const where = whereClauses.length > 0 ? whereClauses.join(" and ") : null;
    let sql = "select * from Customer";
    if (where) {
      sql += ` where ${where}`;
    }
    sql += ` startposition 1 maxresults ${max}`;

    const resp = await withRefresh(qboQuery, tokens, sql);
    return respond(resp);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}

