/**
 * CUSTOMERS PAGE
 *
 * Route: /customers
 * Purpose: View customer insights and analytics
 *
 * API Calls:
 * - GET /api/customers - Fetch all customers
 * - GET /api/customers/:id/insights - Fetch customer insights (customer_insights API)
 * - GET /api/customers/:id/invoices - Fetch customer invoices
 *
 * Features:
 * - Customer directory
 * - AI-powered insights per customer
 * - Revenue analysis
 * - Payment patterns
 */

import { Suspense } from "react"
import CustomersHeader from "@/components/customers/customers-header"
import CustomersList from "@/components/customers/customers-list"
import CustomerInsights from "@/components/customers/customer-insights"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Customers - AI Bookkeeping Platform",
  description: "View customer insights and analytics",
}

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-background">
      <CustomersHeader />

      <main className="container mx-auto p-6 space-y-6">
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <CustomerInsights />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <CustomersList />
        </Suspense>
      </main>
    </div>
  )
}
