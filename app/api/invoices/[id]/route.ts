import { type NextRequest, NextResponse } from "next/server"
import { mockInvoices } from "@/lib/mock-data"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const invoice = mockInvoices.find((i) => i.Id === id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ Invoice: invoice })
  } catch (error: any) {
    console.error("[v0] Invoice fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch invoice" }, { status: 500 })
  }
}
