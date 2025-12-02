"use client"

import { useState } from "react"
import ReportsHeader from "@/components/reports/reports-header"
import ProfitLossReport from "@/components/reports/profit-loss-report"
import ReportFilters, { type ReportFilters as ReportFiltersType } from "@/components/reports/report-filters"
import { useToast } from "@/hooks/use-toast"
import { reportsApi } from "@/lib/api-client"

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateReport = async (filters: ReportFiltersType) => {
    setIsLoading(true)

    try {
      const result = await reportsApi.generate({
        report_type: filters.report_type,
        start_date: filters.start_date,
        end_date: filters.end_date,
        format: filters.format,
        delivery_channel: filters.delivery_channel,
      })

      if (result.error) {
        throw new Error(result.error.error || "Failed to generate report")
      }

      setReportData(result.data || null)

      toast({
        title: "Report Generated",
        description: "Your financial report has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ReportsHeader />

      <main className="container mx-auto p-6 space-y-6">
        <ReportFilters onGenerate={handleGenerateReport} data={reportData} isLoading={isLoading} />
        <ProfitLossReport data={reportData} isLoading={isLoading} />
      </main>
    </div>
  )
}
