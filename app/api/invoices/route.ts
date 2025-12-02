import { NextResponse } from "next/server"
import { mockInvoices } from "@/lib/mock-data"

export async function GET() {
  try {
    return NextResponse.json({ QueryResponse: { Invoice: mockInvoices } })
  } catch (error: any) {
    console.error("[v0] Invoices fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch invoices" }, { status: 500 })
  }
}
