import { NextRequest, NextResponse } from "next/server";
import {
  processTransactionWithSmythOS,
  organizeTransactionData,
  createPurchaseInQBO,
} from "@/lib/transactions";

export async function POST(request: NextRequest) {
  console.log("💳 [PROCESS TRANSACTION] Received transaction processing request");

  try {
    // Step 1: Parse request body
    const body = await request.json();
    const userMessage = body.user_message || body.message || body.text;

    if (!userMessage) {
      console.error("❌ [PROCESS TRANSACTION] Missing user_message in request body");
      return NextResponse.json(
        { error: "Missing required field: user_message" },
        { status: 400 }
      );
    }

    console.log("💳 [PROCESS TRANSACTION] User message:", userMessage);

    // Step 2: Call SmythOS to process the transaction
    console.log("💳 [PROCESS TRANSACTION] Step 1: Processing with SmythOS...");
    let smythosData;
    try {
      smythosData = await processTransactionWithSmythOS(userMessage);
      console.log("💳 [PROCESS TRANSACTION] SmythOS response received");
    } catch (error: any) {
      console.error("❌ [PROCESS TRANSACTION] SmythOS error:", error);
      return NextResponse.json(
        {
          error: `Failed to process transaction with SmythOS: ${error.message}`,
          details: error.toString(),
        },
        { status: 500 }
      );
    }

    // Step 3: Organize and validate the transaction data
    console.log("💳 [PROCESS TRANSACTION] Step 2: Organizing transaction data...");
    let organizedResult;
    try {
      organizedResult = await organizeTransactionData(smythosData);
      console.log("💳 [PROCESS TRANSACTION] Transaction data organized");
    } catch (error: any) {
      console.error("❌ [PROCESS TRANSACTION] Organization error:", error);
      return NextResponse.json(
        {
          error: `Failed to organize transaction data: ${error.message}`,
          smythos_response: smythosData,
        },
        { status: 400 }
      );
    }

    const organizedTransaction = organizedResult.transaction;
    const quickbooksPayload = organizedResult.quickbooksPayload; // just for debugging

    console.log(
      "💳 [PROCESS TRANSACTION] Organized transaction:",
      organizedTransaction
    );
    console.log(
      "💳 [PROCESS TRANSACTION] Raw quickbooks_payload from SmythOS:",
      quickbooksPayload
    );

    // Step 4: Create purchase in QuickBooks
    console.log("💳 [PROCESS TRANSACTION] Step 3: Creating purchase in QuickBooks...");
    let qboResponse;
    try {
      // ✅ PASS THE TRANSACTION OBJECT, NOT THE PAYLOAD
      qboResponse = await createPurchaseInQBO(organizedTransaction);
      console.log("💳 [PROCESS TRANSACTION] Purchase created successfully");
    } catch (error: any) {
      console.error("❌ [PROCESS TRANSACTION] QuickBooks error:", error);
      return NextResponse.json(
        {
          error: `Failed to create purchase in QuickBooks: ${error.message}`,
          organized_transaction: organizedTransaction,
          quickbooks_payload: quickbooksPayload,
          smythos_response: smythosData,
        },
        { status: 500 }
      );
    }

    // Step 5: Extract purchase details
    const purchase = qboResponse?.Purchase || qboResponse?.purchase || {};
    const purchaseId = purchase?.Id;
    const purchaseLink = purchaseId
      ? `https://app.sandbox.qbo.intuit.com/app/purchase?txnId=${purchaseId}`
      : null;

    return NextResponse.json({
      status: "purchase_created",
      purchase_id: purchaseId || null,
      purchase_link: purchaseLink,
      vendor_name: organizedTransaction.vendor_name,
      amount: organizedTransaction.amount,
      date: organizedTransaction.date,
      quickbooks_response: qboResponse,
      organized_transaction: organizedTransaction,
      quickbooks_payload: quickbooksPayload,
      smythos_response: smythosData,
    });
  } catch (error: any) {
    console.error("❌ [PROCESS TRANSACTION] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process transaction",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
