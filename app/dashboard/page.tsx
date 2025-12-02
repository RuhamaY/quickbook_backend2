/**
 * DASHBOARD PAGE
 *
 * Route: /
 * Purpose: Main dashboard showing financial overview and key metrics
 *
 * API Calls:
 * - GET /api/dashboard/metrics - Fetch total expenses, income, net profit
 * - GET /api/dashboard/expense-categories - Top 5 expense categories
 * - GET /api/dashboard/monthly-trend - Monthly spend data
 * - GET /api/dashboard/recent-transactions - Recent QuickBooks transactions
 * - GET /api/dashboard/ai-alerts - AI-generated alerts
 * - GET /api/vendor-insights - Quick vendor summary
 *
 * State Management:
 * - Uses SWR for data fetching and caching
 * - Automatic revalidation on focus
 * - Optimistic updates for quick actions
 */

import { Suspense } from "react"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import MetricsOverview from "@/components/dashboard/metrics-overview"
import ExpenseChart from "@/components/dashboard/expense-chart"
import MonthlyTrendChart from "@/components/dashboard/monthly-trend-chart"
import RecentTransactions from "@/components/dashboard/recent-transactions"
import AIAlerts from "@/components/dashboard/ai-alerts"
import VendorSummary from "@/components/dashboard/vendor-summary"
import QuickActions from "@/components/dashboard/quick-actions"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Dashboard - AI Bookkeeping Platform",
  description: "Your AI-powered bookkeeping automation dashboard",
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto p-6 space-y-6">
        {/* Top Metrics Row */}
        <Suspense fallback={<MetricsSkeleton />}>
          <MetricsOverview />
        </Suspense>

        {/* AI Alerts - High Priority */}
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <AIAlerts />
        </Suspense>

        {/* Quick Actions */}
        <QuickActions />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ExpenseChart />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MonthlyTrendChart />
          </Suspense>
        </div>

        {/* Data Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <RecentTransactions />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <VendorSummary />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  )
}
