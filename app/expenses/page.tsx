/**
 * EXPENSES PAGE
 *
 * Route: /expenses
 * Purpose: Categorize and analyze expenses
 *
 * API Calls:
 * - GET /api/expenses - Fetch all expenses
 * - POST /api/expenses/categorize - Categorize expense (categorize_expense API)
 * - GET /api/expenses/uncategorized - Fetch uncategorized expenses
 * - GET /api/expenses/categories - Fetch expense categories
 *
 * Features:
 * - View all expenses
 * - AI-powered categorization
 * - Bulk categorization
 * - Category management
 */

import { Suspense } from "react"
import ExpensesHeader from "@/components/expenses/expenses-header"
import ExpensesList from "@/components/expenses/expenses-list"
import UncategorizedAlert from "@/components/expenses/uncategorized-alert"
import CategoryBreakdown from "@/components/expenses/category-breakdown"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Expenses - AI Bookkeeping Platform",
  description: "Categorize and analyze your expenses",
}

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-background">
      <ExpensesHeader />

      <main className="container mx-auto p-6 space-y-6">
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <UncategorizedAlert />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <ExpensesList />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <CategoryBreakdown />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
