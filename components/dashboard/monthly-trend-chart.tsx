"use client"

/**
 * MONTHLY TREND CHART COMPONENT
 *
 * API Call: GET /api/dashboard/monthly-trend
 * Response: {
 *   months: [
 *     { month: string, expenses: number, income: number, profit: number }
 *   ]
 * }
 *
 * Displays monthly spend trendline
 */

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function MonthlyTrendChart() {
  const { data, error, isLoading } = useSWR("/api/dashboard/monthly-trend", fetcher)

  if (isLoading) return <ChartSkeleton />
  if (error) return <div>Failed to load trend data</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Last 12 months</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.months}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={3}
              name="Income"
              dot={{ fill: "#10B981", r: 5, strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 7 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              strokeWidth={3}
              name="Expenses"
              dot={{ fill: "#EF4444", r: 5, strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 7 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3B82F6"
              strokeWidth={3}
              name="Profit"
              dot={{ fill: "#3B82F6", r: 5, strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  )
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-sm">
        <p className="text-sm font-medium mb-2">{payload[0].payload.month}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
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
