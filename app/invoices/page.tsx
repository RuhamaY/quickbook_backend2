/**
 * INVOICES PAGE
 *
 * Route: /invoices
 * Purpose: Generate invoices and view insights
 *
 * API Calls:
 * - GET /api/invoices - Fetch all invoices
 * - POST /api/invoices/generate - Generate new invoice
 * - GET /api/invoices/:id/insights - Fetch invoice insights (invoice_insights API)
 * - PUT /api/invoices/:id - Update invoice
 *
 * Features:
 * - Invoice creation
 * - AI-powered insights
 * - Payment tracking
 * - Send invoices
 */

import { Suspense } from "react"
import InvoicesHeader from "@/components/invoices/invoices-header"
import InvoicesList from "@/components/invoices/invoices-list"
import InvoiceInsights from "@/components/invoices/invoice-insights"
import DocumentUpload from "@/components/invoices/document-upload"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Invoices - AI Bookkeeping Platform",
  description: "Generate and manage invoices",
}

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <InvoicesHeader />

      <main className="container mx-auto p-6 space-y-6">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <DocumentUpload />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <InvoiceInsights />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <InvoicesList />
        </Suspense>
      </main>
    </div>
  )
}
