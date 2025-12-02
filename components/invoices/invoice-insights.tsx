"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, AlertCircle, Calendar } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"
import { Skeleton } from "@/components/ui/skeleton"

export default function InvoiceInsights() {
  const { invoices, bills } = useAppData()
  const [showInsights, setShowInsights] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    // Simulate AI analysis delay
    setTimeout(() => {
      setShowInsights(true)
      setIsAnalyzing(false)
    }, 1500)
  }

  // Calculate insights from actual data
  const totalReceivables = invoices.reduce(
    (sum, inv) => sum + (inv.Balance ?? 0),
    0
  )

  const totalPayables = bills.reduce(
    (sum, bill) => sum + (bill.Balance ?? 0),
    0
  )

  const overdueInvoices = invoices.filter((inv) => {
    const balance = inv.Balance ?? 0
    if (balance <= 0) return false
    if (!inv.DueDate) return false

    return new Date(inv.DueDate) < new Date()
  }).length

  const upcomingBills = bills.filter((bill) => {
    const balance = bill.Balance ?? 0
    if (balance <= 0) return false
    if (!bill.DueDate) return false

    const dueDate = new Date(bill.DueDate)
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)

    return dueDate >= today && dueDate <= nextWeek
  }).length

  return (
    <Card className="bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Insights
        </CardTitle>
        {!showInsights && !isAnalyzing && (
          <Button onClick={handleAnalyze} size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Analyze Documents
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!showInsights ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            {isAnalyzing ? (
              <div className="space-y-4 w-full max-w-md">
                <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse">
                  <Sparkles className="h-4 w-4" />
                  <span>Analyzing {invoices.length + bills.length} documents...</span>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%]" />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground max-w-sm">
                Click analyze to generate AI-powered insights about your cash flow, upcoming obligations, and collection
                opportunities.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Net Cash Position
              </div>
              <div className="text-2xl font-bold">
                ${(totalReceivables - totalPayables).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Receivables: ${totalReceivables.toLocaleString()} • Payables: ${totalPayables.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Attention Needed
              </div>
              <div className="text-2xl font-bold">{overdueInvoices} Overdue</div>
              <p className="text-xs text-muted-foreground">Invoices requiring immediate follow-up</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4 text-blue-500" />
                Upcoming Week
              </div>
              <div className="text-2xl font-bold">{upcomingBills} Bills Due</div>
              <p className="text-xs text-muted-foreground">Payments scheduled for the next 7 days</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
