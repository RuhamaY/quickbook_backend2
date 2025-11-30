// app/api/expense-categories/route.ts
import { NextResponse } from "next/server";
import { API_HOST, MINOR_VERSION } from "@/lib/config";
import { loadTokens } from "@/lib/tokens";

/**
 * GET /api/expense-categories
 *
 * Returns QuickBooks "expense categories", which are Accounts with:
 *   AccountType in ('Expense', 'Other Expense', 'Cost of Goods Sold')
 */
export async function GET() {
  // 1) Load tokens saved after OAuth callback
  const tokens = await loadTokens();

  if (!tokens || !tokens.access_token || !tokens.realm_id) {
    return NextResponse.json(
      {
        error:
          "Not authorized with QuickBooks. Complete the /auth/start → /auth/callback flow first.",
      },
      { status: 400 }
    );
  }

  const accessToken = tokens.access_token;
  const realmId = tokens.realm_id;

  // 2) Build QBO SQL query
  const sql =
    "select Id, Name, AccountType, AccountSubType " +
    "from Account " +
    "where AccountType in ('Expense', 'Other Expense', 'Cost of Goods Sold') " +
    "startposition 1 maxresults 100";

  const url = new URL(
    `/v3/company/${realmId}/query`,
    API_HOST
  );

  url.searchParams.set("query", sql);
  url.searchParams.set("minorversion", MINOR_VERSION);

  try {
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/text", // QBO is picky, but this works
      },
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: "QuickBooks query failed",
          status: resp.status,
          qbo_error: data,
        },
        { status: resp.status }
      );
    }

    // 3) Return QBO's response directly (or map it if you want)
    // QBO shape:
    // {
    //   "QueryResponse": {
    //     "Account": [ { Id, Name, AccountType, AccountSubType, ... }, ... ],
    //     "startPosition": 1,
    //     "maxResults": 100
    //   },
    //   "time": "..."
    // }
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to call QuickBooks API",
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
