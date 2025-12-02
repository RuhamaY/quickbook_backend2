"use server"

import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const transactionSchema = z.object({
  vendor_name: z.string().describe("The name of the vendor or merchant"),
  amount: z.number().describe("The transaction amount"),
  currency: z.string().default("USD").describe("The currency code (e.g., USD, EUR)"),
  txn_date: z.string().describe("The transaction date in YYYY-MM-DD format"),
  payment_method: z
    .enum(["card", "bank_transfer", "cash", "check"])
    .default("card")
    .describe("The payment method used"),
  source: z
    .enum(["manual", "bank_feed", "invoice", "other"])
    .default("manual")
    .describe("The source of the transaction"),
  memo: z.string().describe("A brief description or memo for the transaction"),
  category_hint: z.string().describe("A category hint for the transaction (e.g., Office Supplies, Travel)"),
})

export async function parseTransactionText(text: string) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: transactionSchema,
      prompt: `Parse the following financial transaction text into structured data. 
      If the date is relative (e.g., "yesterday", "today"), calculate the actual date based on today's date: ${new Date().toISOString().split("T")[0]}.
      If specific fields are missing, try to infer them or use sensible defaults.
      
      Transaction text: "${text}"`,
    })

    return { success: true, data: object }
  } catch (error) {
    console.error("Failed to parse transaction:", error)
    return { success: false, error: "Failed to parse transaction text" }
  }
}
