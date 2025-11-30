import { NextRequest, NextResponse } from "next/server";
import { processDocumentFromUrl, transformSmythOSResponseToInvoice } from "@/lib/smythos";
import { ensureTokens } from "@/lib/tokens";
import { withRefresh, qboPost } from "@/lib/qbo";
import { resolveVendorIdFromQBO, buildQboBillFromInvoice } from "@/lib/bills";
import { getApAccountId, getExpenseAccountId } from "@/lib/config";
import type { InvoiceProcessedOut } from "@/types/models";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  console.log("📥 [PROCESS PDF] Received PDF processing request");
  
  try {
    const body = await request.json();
    const pdfUrl = body.pdf_url || body.url || body.pdfUrl;

    if (!pdfUrl) {
      console.error("❌ [PROCESS PDF] Missing pdf_url in request body");
      return NextResponse.json(
        { error: "Missing required field: pdf_url" },
        { status: 400 }
      );
    }

    console.log("📥 [PROCESS PDF] PDF URL:", pdfUrl);

    // Step 1: Send PDF URL to SmythOS
    console.log("📥 [PROCESS PDF] Step 1: Sending to SmythOS...");
    const smythosResponse = await processDocumentFromUrl(pdfUrl);
    console.log("📥 [PROCESS PDF] SmythOS response received");

    // Step 2: Transform SmythOS response to InvoiceIn format
    console.log("📥 [PROCESS PDF] Step 2: Transforming response...");
    const invoice = transformSmythOSResponseToInvoice(smythosResponse, pdfUrl);

    // Step 3: Validate required fields
    if (!invoice.line_items || invoice.line_items.length === 0) {
      console.error("❌ [PROCESS PDF] No line items found in transformed invoice");
      return NextResponse.json(
        { 
          error: "Could not extract line items from document",
          smythos_response: smythosResponse,
          transformed_invoice: invoice,
        },
        { status: 400 }
      );
    }

    if (invoice.total === 0) {
      console.error("❌ [PROCESS PDF] Total is zero");
      return NextResponse.json(
        { 
          error: "Could not extract total amount from document",
          smythos_response: smythosResponse,
          transformed_invoice: invoice,
        },
        { status: 400 }
      );
    }

    // Step 4: Resolve vendor in QuickBooks (creates if not found)
    console.log("📥 [PROCESS PDF] Step 3: Resolving vendor...");
    let vendorId: string;
    try {
      vendorId = await resolveVendorIdFromQBO(invoice.vendor_name, true); // true = create if not found
      if (!vendorId) {
        throw new Error("Failed to resolve or create vendor");
      }
      console.log("✅ [PROCESS PDF] Vendor resolved/created with ID:", vendorId);
    } catch (error: any) {
      console.error("❌ [PROCESS PDF] Error resolving/creating vendor:", error);
      return NextResponse.json(
        { 
          error: `Could not resolve or create vendor in QuickBooks: ${error.message}`,
          vendor_name: invoice.vendor_name,
          transformed_invoice: invoice,
        },
        { status: 400 }
      );
    }

    // Step 5: Get account IDs
    const apAccountId = getApAccountId();
    const expenseAccountId = getExpenseAccountId();

    if (!apAccountId || !expenseAccountId) {
      console.error("❌ [PROCESS PDF] Missing account IDs");
      return NextResponse.json(
        {
          error:
            "AP_ACCOUNT_ID or EXPENSE_ACCOUNT_ID is not set. Please set these as environment variables in .env.local",
        },
        { status: 500 }
      );
    }

    // Step 6: Build QuickBooks bill payload
    console.log("📥 [PROCESS PDF] Step 4: Building bill payload...");
    const billPayload = buildQboBillFromInvoice(
      invoice,
      vendorId,
      apAccountId,
      expenseAccountId
    );

    // Step 7: Create Bill in QuickBooks
    console.log("📥 [PROCESS PDF] Step 5: Creating bill in QuickBooks...");
    const tokens = await ensureTokens();
    const resp = await withRefresh(qboPost, tokens, "bill", billPayload);

    if (!resp.ok) {
      const text = await resp.text();
      console.error("❌ [PROCESS PDF] QuickBooks API error:", resp.status, text);
      return NextResponse.json(
        { error: text, quickbooks_status: resp.status },
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

    console.log("✅ [PROCESS PDF] Bill created successfully:", billId);
    return NextResponse.json({
      ...result,
      smythos_response: smythosResponse,
      transformed_invoice: invoice,
    });
  } catch (error: any) {
    console.error("❌ [PROCESS PDF] Exception:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to process PDF and create bill",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

