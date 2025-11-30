// Bill creation helpers
import type { InvoiceIn } from "@/types/models";
import { getApAccountId, getExpenseAccountId } from "./config";
import { qboQuery, qboPost, withRefresh } from "./qbo";
import { ensureTokens } from "./tokens";

/**
 * Creates a vendor in QuickBooks
 */
export async function createVendorInQBO(vendorName: string): Promise<string> {
  if (!vendorName) {
    throw new Error("Vendor name is required to create a vendor");
  }

  console.log("🏢 [CREATE VENDOR] Creating vendor:", vendorName);
  const tokens = await ensureTokens();

  const vendorPayload = {
    DisplayName: vendorName,
  };

  const resp = await withRefresh(qboPost, tokens, "vendor", vendorPayload);

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("❌ [CREATE VENDOR] Failed to create vendor:", resp.status, errorText);
    throw new Error(`Failed to create vendor: ${resp.status} - ${errorText}`);
  }

  try {
    const data = await resp.json();
    const vendor = data.Vendor || data.vendor || {};
    const vendorId = vendor.Id;
    
    if (!vendorId) {
      throw new Error("Vendor created but no ID returned");
    }

    console.log("✅ [CREATE VENDOR] Vendor created successfully with ID:", vendorId);
    return vendorId;
  } catch (error: any) {
    console.error("❌ [CREATE VENDOR] Error parsing vendor creation response:", error);
    throw new Error(`Failed to parse vendor creation response: ${error.message}`);
  }
}

/**
 * Resolves vendor ID from QuickBooks, or creates the vendor if it doesn't exist
 */
export async function resolveVendorIdFromQBO(
  vendorName: string | null | undefined,
  createIfNotFound: boolean = true
): Promise<string> {
  if (!vendorName) {
    return "";
  }

  console.log("🔍 [RESOLVE VENDOR] Looking for vendor:", vendorName);
  const tokens = await ensureTokens();
  const where = `DisplayName = '${vendorName.replace(/'/g, "''")}'`; // Escape single quotes for SQL
  const sql = `select * from Vendor where ${where} startposition 1 maxresults 1`;

  const resp = await withRefresh(qboQuery, tokens, sql);
  
  if (!resp.ok) {
    console.error("❌ [RESOLVE VENDOR] Query failed:", resp.status);
    if (createIfNotFound) {
      console.log("🔄 [RESOLVE VENDOR] Query failed, attempting to create vendor...");
      return await createVendorInQBO(vendorName);
    }
    return "";
  }

  try {
    const data = await resp.json();
    const vendors = data?.QueryResponse?.Vendor || [];
    if (vendors.length > 0) {
      const vendorId = vendors[0].Id || "";
      console.log("✅ [RESOLVE VENDOR] Found existing vendor with ID:", vendorId);
      return vendorId;
    }

    // Vendor not found
    console.log("⚠️  [RESOLVE VENDOR] Vendor not found");
    if (createIfNotFound) {
      console.log("🔄 [RESOLVE VENDOR] Creating new vendor...");
      return await createVendorInQBO(vendorName);
    }
    return "";
  } catch (error) {
    console.error("❌ [RESOLVE VENDOR] Error parsing response:", error);
    if (createIfNotFound) {
      console.log("🔄 [RESOLVE VENDOR] Error occurred, attempting to create vendor...");
      return await createVendorInQBO(vendorName);
    }
    return "";
  }
}

export function buildQboBillFromInvoice(
  invoice: InvoiceIn,
  vendorId: string,
  apAccountId: string,
  expenseAccountId: string
): Record<string, any> {
  if (!vendorId) {
    throw new Error("vendor_id is required to create a QuickBooks Bill");
  }

  const lineItems = invoice.line_items.map((item) => ({
    DetailType: "AccountBasedExpenseLineDetail",
    Amount: parseFloat(item.amount.toString()),
    Description: item.description || "",
    AccountBasedExpenseLineDetail: {
      AccountRef: {
        value: expenseAccountId,
      },
    },
  }));

  const bill: Record<string, any> = {
    VendorRef: { value: vendorId },
    APAccountRef: { value: apAccountId },
    Line: lineItems,
    CurrencyRef: { value: "USD" },
  };

  if (invoice.invoice_number) {
    bill.DocNumber = invoice.invoice_number;
  }
  if (invoice.invoice_date) {
    bill.TxnDate = invoice.invoice_date;
  }
  if (invoice.due_date) {
    bill.DueDate = invoice.due_date;
  }

  const noteParts: string[] = [];
  if (invoice.source) {
    noteParts.push(`Source: ${invoice.source}`);
  }
  if (invoice.file_url) {
    noteParts.push(`File: ${invoice.file_url}`);
  }
  if (noteParts.length > 0) {
    bill.PrivateNote = noteParts.join(" | ");
  }

  return bill;
}

