// SmythOS API integration
import { SMYTHOS_URL, getSmythosApiKey } from "./config";
import type { InvoiceIn, InvoiceLineItem } from "@/types/models";

export interface SmythOSResponse {
  // Flexible structure - SmythOS might return various formats
  [key: string]: any;
}

/**
 * Calls SmythOS API to process a document (PDF) from a URL
 */
export async function processDocumentFromUrl(pdfUrl: string): Promise<SmythOSResponse> {
  const apiKey = getSmythosApiKey();
  
  console.log("📄 [SMYTHOS] Processing document from URL:", pdfUrl);
  console.log("📄 [SMYTHOS] API Key:", apiKey ? "SET" : "MISSING");

  if (!apiKey) {
    throw new Error("SMYTHOS_API_KEY is not set. Please set it in .env.local");
  }

  try {
    const response = await fetch(SMYTHOS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        document_url: pdfUrl,  // SmythOS expects "document_url" not "url"
      }),
    });

    console.log("📄 [SMYTHOS] Response status:", response.status);
    console.log("📄 [SMYTHOS] Response content-type:", response.headers.get("content-type"));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [SMYTHOS] Error response:", errorText);
      throw new Error(`SmythOS API error: ${response.status} - ${errorText}`);
    }

    // SmythOS returns text/plain, so we need to parse it
    const responseText = await response.text();
    console.log("📄 [SMYTHOS] Raw response (first 500 chars):", responseText.substring(0, 500));

    // Try to parse as JSON (it might be JSON in a text/plain response)
    let data: SmythOSResponse;
    try {
      data = JSON.parse(responseText);
      console.log("✅ [SMYTHOS] Response parsed as JSON");
    } catch (parseError) {
      // If it's not JSON, treat it as a plain text response
      console.log("⚠️  [SMYTHOS] Response is not JSON, treating as plain text");
      // Try to extract JSON from the text if it contains JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
          console.log("✅ [SMYTHOS] Extracted JSON from text response");
        } catch (e) {
          // If we can't parse it, wrap it in an object
          data = { raw_text: responseText, error: "Could not parse response as JSON" };
          console.warn("⚠️  [SMYTHOS] Could not parse JSON from response, using raw text");
        }
      } else {
        // No JSON found, wrap the text response
        data = { raw_text: responseText };
        console.warn("⚠️  [SMYTHOS] No JSON found in response, using raw text");
      }
    }

    console.log("✅ [SMYTHOS] Document processed successfully");
    console.log("📄 [SMYTHOS] Response keys:", Object.keys(data));
    return data;
  } catch (error: any) {
    console.error("❌ [SMYTHOS] Exception:", error);
    throw error;
  }
}

/**
 * Transforms SmythOS response to InvoiceIn format
 * Handles various response formats from SmythOS
 */
export function transformSmythOSResponseToInvoice(
  smythosResponse: SmythOSResponse,
  pdfUrl: string
): InvoiceIn {
  console.log("🔄 [TRANSFORM] Transforming SmythOS response to InvoiceIn format");
  console.log("🔄 [TRANSFORM] Response type:", typeof smythosResponse);
  console.log("🔄 [TRANSFORM] Response keys:", Object.keys(smythosResponse));

  // Handle text/plain response that might be a JSON string
  let responseData: any = smythosResponse;
  
  // If response has raw_text (from text/plain parsing), try to parse it
  if (smythosResponse.raw_text && typeof smythosResponse.raw_text === 'string') {
    console.log("🔄 [TRANSFORM] Found raw_text, attempting to parse...");
    try {
      responseData = JSON.parse(smythosResponse.raw_text);
      console.log("✅ [TRANSFORM] Successfully parsed raw_text as JSON");
    } catch (e) {
      console.warn("⚠️  [TRANSFORM] Could not parse raw_text, using original response");
      responseData = smythosResponse;
    }
  }

  // Handle different possible response structures
  let invoiceData: any = responseData;

  // If response is nested, try to extract the invoice data
  // Check for structured_data first (SmythOS format)
  if (responseData.structured_data) {
    // structured_data might be a JSON string that needs parsing
    if (typeof responseData.structured_data === 'string') {
      console.log("🔄 [TRANSFORM] structured_data is a string, parsing JSON...");
      try {
        invoiceData = JSON.parse(responseData.structured_data);
        console.log("✅ [TRANSFORM] Successfully parsed structured_data JSON string");
      } catch (parseError) {
        console.error("❌ [TRANSFORM] Failed to parse structured_data as JSON:", parseError);
        // Fall back to using it as-is or try other paths
        invoiceData = responseData.structured_data;
      }
    } else {
      // structured_data is already an object
      invoiceData = responseData.structured_data;
      console.log("✅ [TRANSFORM] Found data in structured_data (already an object)");
    }
  } else if (responseData.invoice) {
    invoiceData = responseData.invoice;
    console.log("✅ [TRANSFORM] Found data in invoice");
  } else if (responseData.data) {
    invoiceData = responseData.data;
    console.log("✅ [TRANSFORM] Found data in data");
  } else if (responseData.result) {
    invoiceData = responseData.result;
    console.log("✅ [TRANSFORM] Found data in result");
  } else {
    console.log("⚠️  [TRANSFORM] Using response data directly (no nesting found)");
  }
  
  console.log("🔄 [TRANSFORM] Invoice data type:", typeof invoiceData);
  console.log("🔄 [TRANSFORM] Invoice data keys:", invoiceData && typeof invoiceData === 'object' ? Object.keys(invoiceData) : "Not an object");

  // Transform line items - handle various formats
  let lineItems: InvoiceLineItem[] = [];
  
  if (Array.isArray(invoiceData.line_items)) {
    lineItems = invoiceData.line_items.map((item: any) => ({
      description: item.description || item.desc || item.item || null,
      quantity: parseFloat(item.quantity?.toString() || "1"),
      unit_price: parseFloat(item.unit_price?.toString() || item.price?.toString() || item.unitPrice?.toString() || "0"),
      amount: parseFloat(item.amount?.toString() || item.total?.toString() || "0"),
    }));
  } else if (Array.isArray(invoiceData.items)) {
    lineItems = invoiceData.items.map((item: any) => ({
      description: item.description || item.desc || item.name || null,
      quantity: parseFloat(item.quantity?.toString() || "1"),
      unit_price: parseFloat(item.unit_price?.toString() || item.price?.toString() || item.unitPrice?.toString() || "0"),
      amount: parseFloat(item.amount?.toString() || item.total?.toString() || "0"),
    }));
  } else if (Array.isArray(invoiceData.lines)) {
    lineItems = invoiceData.lines.map((item: any) => ({
      description: item.description || item.desc || item.name || null,
      quantity: parseFloat(item.quantity?.toString() || "1"),
      unit_price: parseFloat(item.unit_price?.toString() || item.price?.toString() || item.unitPrice?.toString() || "0"),
      amount: parseFloat(item.amount?.toString() || item.total?.toString() || "0"),
    }));
  }

  // If no line items found but we have other data, create a default line item
  if (lineItems.length === 0 && invoiceData.total) {
    lineItems = [{
      description: invoiceData.description || "Invoice line item",
      quantity: 1,
      unit_price: parseFloat(invoiceData.total?.toString() || "0"),
      amount: parseFloat(invoiceData.total?.toString() || "0"),
    }];
  }

  // Calculate totals if not provided
  let subtotal = parseFloat(invoiceData.subtotal?.toString() || "0");
  let tax = parseFloat(invoiceData.tax?.toString() || invoiceData.tax_amount?.toString() || "0");
  let total = parseFloat(invoiceData.total?.toString() || "0");

  // If totals are missing, calculate from line items
  if (subtotal === 0 && lineItems.length > 0) {
    subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  }
  if (total === 0) {
    total = subtotal + tax;
  }

  const invoice: InvoiceIn = {
    vendor_name: invoiceData.vendor_name || invoiceData.vendor || invoiceData.supplier || invoiceData.supplier_name || null,
    invoice_number: invoiceData.invoice_number || invoiceData.invoice_no || invoiceData.number || invoiceData.doc_number || null,
    invoice_date: invoiceData.invoice_date || invoiceData.date || invoiceData.invoiceDate || null,
    due_date: invoiceData.due_date || invoiceData.dueDate || invoiceData.due || null,
    currency: invoiceData.currency || invoiceData.currency_code || "USD",
    line_items: lineItems,
    subtotal: subtotal,
    tax: tax,
    total: total,
    source: "SmythOS OCR",
    original_subject: invoiceData.subject || invoiceData.title || null,
    sender_email: invoiceData.sender_email || invoiceData.email || invoiceData.senderEmail || null,
    file_url: pdfUrl,
  };

  console.log("✅ [TRANSFORM] Transformation complete");
  console.log("✅ [TRANSFORM] Vendor:", invoice.vendor_name);
  console.log("✅ [TRANSFORM] Total:", invoice.total);
  console.log("✅ [TRANSFORM] Line items count:", invoice.line_items.length);

  return invoice;
}

