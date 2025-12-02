"use client"

/**
 * AI ALERTS COMPONENT
 *
 * API Call: GET /api/dashboard/ai-alerts
 * Response: {
 *   alerts: [
 *     {
 *       id: string,
 *       type: 'warning' | 'info' | 'error',
 *       title: string,
 *       message: string,
 *       action?: { label: string, href: string }
 *     }
 *   ]
 * }
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Info, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAppData } from "@/contexts/app-data-context"

export default function AIAlerts() {
  const { expenses } = useAppData()

  const uncategorizedCount = expenses.filter(
    (t) => !t.AccountRef || t.AccountRef.name === "Uncategorized" || t.AccountRef.name === "Unorganized",
  ).length

  const alerts = []

  if (uncategorizedCount > 0) {
    alerts.push({
      id: "alert-uncat",
      type: "warning",
      title: "Uncategorized Expenses",
      message: `You have ${uncategorizedCount} transactions that need categorization.`,
      action: { label: "Review", href: "/expenses" },
    })
  }

  const highValueExpenses = expenses.filter((t) => t.TotalAmt > 1000).length
  if (highValueExpenses > 0) {
    alerts.push({
      id: "alert-high-value",
      type: "info",
      title: "High Value Transactions",
      message: `${highValueExpenses} transactions over $1,000 recorded this month.`,
      action: { label: "View Details", href: "/expenses" },
    })
  }

  alerts.push({
    id: "alert-tax",
    type: "info",
    title: "Tax Season Prep",
    message: "Q1 estimated tax payments are due soon. Review your profit & loss statement.",
    action: { label: "Go to Reports", href: "/reports" },
  })

  if (!alerts.length) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <Badge variant="secondary">{alerts.length} alerts</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert: any) => (
          <div key={alert.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            {alert.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
            {alert.type === "error" && <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
            {alert.type === "info" && <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              {alert.action && (
                <Button variant="link" size="sm" asChild className="h-auto p-0">
                  <Link href={alert.action.href}>{alert.action.label} →</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
