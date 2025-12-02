"use client"

/**
 * QUICK ACTIONS COMPONENT
 *
 * Provides quick access to common actions:
 * - Record Transaction (opens modal → POST /api/transactions/record)
 * - Categorize Expense (navigates to /expenses with filter)
 * - Run Vendor Insights (triggers POST /api/vendors/analyze)
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Tag, TrendingUp, FileText } from "lucide-react"
import { useState } from "react"
import RecordTransactionModal from "@/components/modals/record-transaction-modal"
import { useRouter } from "next/navigation"

export default function QuickActions() {
  const [showRecordModal, setShowRecordModal] = useState(false)
  const router = useRouter()

  const handleVendorInsights = async () => {
    // Trigger vendor insights analysis
    await fetch("/api/vendors/analyze", { method: "POST" })
    router.push("/vendors")
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowRecordModal(true)} className="flex-1 md:flex-none">
              <Plus className="mr-2 h-4 w-4" />
              Record Transaction
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/expenses")}
              className="flex-1 md:flex-none hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 dark:hover:border-blue-800"
            >
              <Tag className="mr-2 h-4 w-4" />
              Categorize Expenses
            </Button>
            <Button
              variant="outline"
              onClick={handleVendorInsights}
              className="flex-1 md:flex-none bg-transparent hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 dark:hover:border-blue-800"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Run Vendor Insights
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/reports")}
              className="flex-1 md:flex-none hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 dark:hover:border-blue-800"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <RecordTransactionModal open={showRecordModal} onClose={() => setShowRecordModal(false)} />
    </>
  )
}
