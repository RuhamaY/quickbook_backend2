"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { ReportResponse } from "@/lib/api-client"

interface ProfitLossReportProps {
  data?: ReportResponse | null
  isLoading?: boolean
}

const COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
]

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatReportType(type: string): string {
  const types: Record<string, string> = {
    profit_loss: "Profit & Loss",
    balance_sheet: "Balance Sheet",
    cash_flow: "Cash Flow",
  }
  return types[type] || type
}

export default function ProfitLossReport({ data, isLoading }: ProfitLossReportProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Select a date range and click Generate Report to view your financial data
          </p>
        </CardContent>
      </Card>
    )
  }

  const report = data.result?.Output?.final_response?.report
  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Invalid report data format. Please try generating the report again.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { totals, top_expense_categories, period, report_type } = report

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `financial-report-${period.start_date}-to-${period.end_date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const chartData = top_expense_categories
    .filter((cat) => cat.amount > 0)
    .map((cat) => ({
      name: cat.name,
      value: cat.amount,
    }))

  const totalExpenses = totals.expenses || 0

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{formatReportType(report_type)}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(totals.income)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {formatCurrency(totals.expenses)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    (totals.net || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(totals.net)}
                </p>
              </div>
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  (totals.net || 0) >= 0
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-red-100 dark:bg-red-900/20"
                }`}
              >
                <DollarSign
                  className={`h-6 w-6 ${(totals.net || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories Breakdown */}
      {top_expense_categories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <p className="text-sm text-muted-foreground">Top expense categories breakdown</p>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">No expense data available</p>
              )}
            </CardContent>
          </Card>

          {/* Category List */}
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
              <p className="text-sm text-muted-foreground">Expense breakdown by category</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {top_expense_categories
                  .filter((cat) => cat.amount > 0)
                  .map((category, index) => {
                    const percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0
                    return (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                            <span className="font-semibold">{formatCurrency(category.amount)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                {top_expense_categories.filter((cat) => cat.amount > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No expense categories found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
