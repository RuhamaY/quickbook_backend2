/**
 * VENDORS PAGE
 *
 * Route: /vendors
 * Purpose: View vendor insights and analytics
 *
 * API Calls:
 * - GET /api/vendors - Fetch all vendors
 * - GET /api/vendors/:id/insights - Fetch vendor insights (vendor_insights API)
 * - GET /api/vendors/:id/transactions - Fetch vendor transaction history
 *
 * Features:
 * - Vendor directory
 * - AI-powered insights per vendor
 * - Spend analysis
 * - Anomaly detection
 */

import { Suspense } from "react"
import VendorsHeader from "@/components/vendors/vendors-header"
import VendorsList from "@/components/vendors/vendors-list"
import VendorInsights from "@/components/vendors/vendor-insights"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Vendors - AI Bookkeeping Platform",
  description: "View vendor insights and analytics",
}

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <VendorsHeader />

      <main className="container mx-auto p-6 space-y-6">
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <VendorInsights />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <VendorsList />
        </Suspense>
      </main>
    </div>
  )
}
