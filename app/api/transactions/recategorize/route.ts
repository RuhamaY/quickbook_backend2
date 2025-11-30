import { NextRequest, NextResponse } from "next/server";
import { recategorizeTransaction } from "@/lib/categorize";

export async function POST(request: NextRequest) {
  console.log("🔄 [RECATEGORIZE API] Received recategorization request");

  try {
    const body = await request.json();
    const transactionId = body.transaction_id || body.id || body.purchase_id || body.expense_id;

    if (!transactionId) {
      console.error("❌ [RECATEGORIZE API] Missing transaction_id in request body");
      return NextResponse.json(
        { error: "Missing required field: transaction_id (or id, purchase_id, expense_id)" },
        { status: 400 }
      );
    }

    console.log("🔄 [RECATEGORIZE API] Transaction ID:", transactionId);
    console.log("🔄 [RECATEGORIZE API] Auto-detecting purchase vs expense...");

    // Recategorize the transaction (auto-detects purchase vs expense)
    const result = await recategorizeTransaction(transactionId);

    return NextResponse.json({
      status: "success",
      message: "Transaction recategorized successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("❌ [RECATEGORIZE API] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to recategorize transaction",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

