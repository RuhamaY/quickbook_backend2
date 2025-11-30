import { NextRequest, NextResponse } from "next/server";
import { ensureTokens } from "@/lib/tokens";
import { withRefresh, qboPost } from "@/lib/qbo";
import { resolveVendorIdFromQBO, buildQboBillFromInvoice } from "@/lib/bills";
import { getApAccountId, getExpenseAccountId } from "@/lib/config";
import type { InvoiceIn, InvoiceProcessedOut } from "@/types/models";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const invoice: InvoiceIn = await request.json();

    // Read account IDs at runtime
    const apAccountId = getApAccountId();
    const expenseAccountId = getExpenseAccountId();

    // Resolve vendor in QuickBooks from vendor_name (creates if not found)
    console.log("🔍 [FROM OCR] Resolving vendor:", invoice.vendor_name);
    let vendorId: string;
    try {
      vendorId = await resolveVendorIdFromQBO(invoice.vendor_name, true); // true = create if not found
      if (!vendorId) {
        throw new Error("Failed to resolve or create vendor");
      }
      console.log("✅ [FROM OCR] Vendor resolved/created with ID:", vendorId);
    } catch (error: any) {
      console.error("❌ [FROM OCR] Error resolving/creating vendor:", error);
      return NextResponse.json(
        { 
          error: `Could not resolve or create vendor in QuickBooks: ${error.message}`,
          vendor_name: invoice.vendor_name,
        },
        { status: 400 }
      );
    }

    if (!apAccountId || !expenseAccountId) {
      return NextResponse.json(
        {
          error:
            "AP_ACCOUNT_ID or EXPENSE_ACCOUNT_ID is not set. Please set these as environment variables in .env.local",
        },
        { status: 500 }
      );
    }

    const billPayload = buildQboBillFromInvoice(
      invoice,
      vendorId,
      apAccountId,
      expenseAccountId
    );

    // Create Bill in QuickBooks
    const tokens = await ensureTokens();
    const resp = await withRefresh(qboPost, tokens, "bill", billPayload);

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: text },
        { status: resp.status }
      );
    }

    const qboData = await resp.json();
    const billObj = qboData.Bill || qboData.bill || {};
    const billId = billObj.Id;
    const billLink = billId
      ? `https://app.sandbox.qbo.intuit.com/app/bill?txnId=${billId}`
      : null;

    const internalId = randomUUID();

    const result: InvoiceProcessedOut = {
      status: "bill_created",
      internal_invoice_id: internalId,
      vendor_name: invoice.vendor_name || null,
      total: invoice.total,
      quickbooks_bill_id: billId || null,
      quickbooks_link: billLink || null,
      quickbooks_raw_response: qboData || null,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create bill" },
      { status: 500 }
    );
  }
}

