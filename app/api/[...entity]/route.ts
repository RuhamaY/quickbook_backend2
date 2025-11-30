import { NextRequest, NextResponse } from "next/server";
import { ensureTokens } from "@/lib/tokens";
import { withRefresh, qboQuery, qboGetById, respond } from "@/lib/qbo";
import { ENTITY_MAP } from "@/lib/config";

// Handle both list and by-id routes
// /api/customers -> list
// /api/customers/123 -> by-id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string[] }> | { entity: string[] } }
) {
  const resolvedParams = await Promise.resolve(params);
  const entityPath = resolvedParams.entity;
  
  if (entityPath.length === 0) {
    return NextResponse.json({ error: "Invalid entity path" }, { status: 400 });
  }

  const plural = entityPath[0];
  const entityId = entityPath.length > 1 ? entityPath[1] : null;

  if (!ENTITY_MAP[plural]) {
    return NextResponse.json(
      { error: `Unknown entity: ${plural}` },
      { status: 400 }
    );
  }

  const [entity, resource] = ENTITY_MAP[plural];

  try {
    const tokens = await ensureTokens();

    if (entityId) {
      // Get by ID
      const resp = await withRefresh(qboGetById, tokens, resource, entityId);
      return respond(resp);
    } else {
      // List entities
      const searchParams = request.nextUrl.searchParams;
      const where = searchParams.get("where");
      const orderby = searchParams.get("orderby");
      const start = parseInt(searchParams.get("start") || "1", 10);
      const max = parseInt(searchParams.get("max") || "100", 10);

      let sql = `select * from ${entity}`;
      if (where) {
        sql += ` where ${where}`;
      }
      if (orderby) {
        sql += ` order by ${orderby}`;
      }
      sql += ` startposition ${start} maxresults ${max}`;

      const resp = await withRefresh(qboQuery, tokens, sql);
      return respond(resp);
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Request failed" },
      { status: 500 }
    );
  }
}

