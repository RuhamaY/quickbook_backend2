"use client"

/**
 * EXPENSE CHART COMPONENT
 *
 * API Call: GET /api/dashboard/expense-categories
 * Response: {
 *   categories: [
 *     { name: string, amount: number, percentage: number, color: string }
 *   ]
 * }
 *
 * Displays top 5 expense categories as a pie chart
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useAppData } from "@/contexts/app-data-context"
import { Loader2 } from "lucide-react"

const COLORS = [
  "#3B82F6", // Vibrant Blue
  "#EC4899", // Vivid Pink
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#10B981", // Emerald
]

export default function ExpenseChart() {
  const { expenses, isLoading } = useAppData()

  if (isLoading) return <ChartSkeleton />

  // Calculate expense categories from transactions
  const categoryTotals = new Map<string, number>()
  
  expenses.forEach((expense) => {
    const category = expense.AccountRef?.name || "Uncategorized"
    const amount = Math.abs(expense.TotalAmt || 0)
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount)
  })

  const total = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0)
  
  const categories = Array.from(categoryTotals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Expense Categories</CardTitle>
          <p className="text-sm text-muted-foreground">Last 30 days breakdown</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No expense data available</p>
        </CardContent>
      </Card>
    )
  }

  const data = { categories }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Expense Categories</CardTitle>
        <p className="text-sm text-muted-foreground">Last 30 days breakdown</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.categories}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="amount"
            >
              {data.categories.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          {data.categories.map((category: any, index: number) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatCurrency(category.amount)}</span>
                <span className="text-sm text-muted-foreground">{category.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-sm">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
