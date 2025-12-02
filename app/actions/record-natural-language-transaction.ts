"use server"

// import { generateObject } from "ai"
// import { openai } from "@ai-sdk/openai"
// import { z } from "zod"

export async function recordNaturalLanguageTransaction(input: string) {
  try {
    // Use the backend API endpoint which handles SmythOS internally
    const response = await fetch("/api/transactions/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        user_message: input,
        }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API request failed with status ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] API Response:", JSON.stringify(result, null, 2))

    // Extract transaction data from the backend response
    const organizedTransaction = result.organized_transaction || result
    const purchase = result.quickbooks_response?.Purchase || result.purchase || {}

    const newTransaction = {
      Id: purchase.Id || result.purchase_id || `txn-${Date.now()}`,
      TxnDate: organizedTransaction.date || purchase.TxnDate || new Date().toISOString().split("T")[0],
      EntityRef: {
        name: organizedTransaction.vendor_name || purchase.EntityRef?.name || "Unknown Vendor",
        value: purchase.EntityRef?.value || `vendor-${Date.now()}`,
      },
      PrivateNote: organizedTransaction.memo || purchase.PrivateNote || input,
      AccountRef: {
        name: organizedTransaction.category || purchase.AccountRef?.name || "Uncategorized",
        value: purchase.AccountRef?.value || `acc-${Date.now()}`,
      },
      TotalAmt: organizedTransaction.amount || purchase.TotalAmt || 0,
      PaymentType: organizedTransaction.payment_method || purchase.PaymentType || "Credit Card",
      Status: purchase.Status || "Cleared",
    }

    return {
      success: true,
      transaction: newTransaction,
    }
  } catch (error) {
    console.error("Error recording transaction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process transaction",
    }
  }
}
