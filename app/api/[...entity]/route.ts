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
      let where = searchParams.get("where");
      const orderby = searchParams.get("orderby");
      const start = parseInt(searchParams.get("start") || "1", 10);
      const max = parseInt(searchParams.get("max") || "100", 10);

      let sql = `select * from ${entity}`;
      
      // QuickBooks Purchase entity doesn't support EntityRef.value in WHERE clauses
      // If this is a Purchase query with EntityRef.value, we'll fetch all and filter client-side
      let needsClientSideFilter = false;
      let entityRefFilter: { field: string; value: string } | null = null;
      
      if (where && entity === "Purchase" && where.includes("EntityRef.value")) {
        // Extract the EntityRef.value filter for client-side filtering
        const match = where.match(/EntityRef\.value\s*=\s*['"]([^'"]+)['"]/);
        if (match) {
          entityRefFilter = { field: "EntityRef.value", value: match[1] };
          needsClientSideFilter = true;
          // Remove EntityRef.value from WHERE clause
          where = where.replace(/EntityRef\.value\s*=\s*['"][^'"]+['"]\s*(and|or)?/gi, "").trim();
          // Clean up any trailing AND/OR
          where = where.replace(/^(and|or)\s+/i, "").replace(/\s+(and|or)$/i, "");
        }
      }
      
      if (where && !needsClientSideFilter) {
        sql += ` where ${where}`;
      }
      if (orderby) {
        sql += ` order by ${orderby}`;
      }
      sql += ` startposition ${start} maxresults ${max}`;

      const resp = await withRefresh(qboQuery, tokens, sql);
      
      // If we need client-side filtering, do it here
      if (needsClientSideFilter && resp.ok) {
        const data = await resp.json();
        const queryResponse = data.QueryResponse || {};
        const purchases = queryResponse.Purchase || [];
        
        // Filter by EntityRef.value client-side
        const filteredPurchases = purchases.filter((purchase: any) => {
          const entityRef = purchase.EntityRef;
          return entityRef && entityRef.value === entityRefFilter!.value;
        });
        
        return NextResponse.json({
          ...data,
          QueryResponse: {
            ...queryResponse,
            Purchase: filteredPurchases,
            maxResults: filteredPurchases.length,
          },
        });
      }
      
      return respond(resp);
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Request failed" },
      { status: 500 }
    );
  }
}

