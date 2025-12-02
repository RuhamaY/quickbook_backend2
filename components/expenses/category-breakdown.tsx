"use client"

/**
 * CATEGORY BREAKDOWN COMPONENT
 *
 * Uses dynamic data from context for visualization
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useState, useEffect, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"

// Updated colors to be more colorful/vibrant
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

export default function CategoryBreakdown() {
  // Use context data
  const { expenses, isLoading } = useAppData()

  // Calculate chart data dynamically from expenses
  const chartData = useMemo(() => {
    const categoryMap = new Map<string, number>()

    expenses.forEach((expense) => {
      // Use line item's account name if available, otherwise fall back to top-level AccountRef
      const firstLine = expense.Line && expense.Line.length > 0 ? expense.Line[0] : null
      const lineAccountRef = firstLine?.AccountBasedExpenseLineDetail?.AccountRef
      const category = lineAccountRef?.name || expense.AccountRef?.name || "Uncategorized"
      const amount = Number(expense.TotalAmt) || 0
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
    })

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 categories
  }, [expenses])

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: "var(--color-popover)", borderRadius: "var(--radius)" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
