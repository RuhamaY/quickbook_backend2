"use client"

/**
 * METRICS OVERVIEW COMPONENT
 *
 * API Call: POST /api/summarize_overview
 * Enforces strict schema compliance
 */

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { API_ENDPOINTS, type SummarizeOverviewRequest, type SummarizeOverviewResponse } from "@/lib/api-config"
import { cn } from "@/lib/utils"

type TimeRange = "30d" | "90d" | "12m"

const fetcher = async ([url, timeRange]: [string, TimeRange]) => {
  const endDate = new Date()
  const startDate = new Date()

  if (timeRange === "30d") startDate.setDate(endDate.getDate() - 30)
  else if (timeRange === "90d") startDate.setDate(endDate.getDate() - 90)
  else startDate.setMonth(endDate.getMonth() - 12)

  const body: SummarizeOverviewRequest = {
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    granularity: timeRange === "12m" ? "monthly" : "weekly",
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error("Failed to fetch metrics")
  return res.json() as Promise<SummarizeOverviewResponse>
}

export default function MetricsOverview() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")

  const { data, error, isLoading } = useSWR([API_ENDPOINTS.SUMMARIZE_OVERVIEW, timeRange], fetcher, {
    refreshInterval: 60000,
  })

  if (isLoading) return <MetricsSkeleton />
  if (error) return <div className="p-4 text-destructive">Failed to load metrics</div>
  if (!data || !data.metrics) return null

  const metrics = [
    {
      title: "Total Expenses",
      value: formatCurrency(data.metrics.expenses ?? 0),
      change: 0, // API doesn't provide change % yet
      icon: ArrowDownRight,
      trend: "negative",
    },
    {
      title: "Total Income",
      value: formatCurrency(data.metrics.income ?? 0),
      change: 0,
      icon: ArrowUpRight,
      trend: "positive",
    },
    {
      title: "Net Profit",
      value: formatCurrency(data.metrics.net ?? 0),
      change: 0,
      icon: DollarSign,
      trend: (data.metrics.net ?? 0) >= 0 ? "positive" : "negative",
    },
    {
      title: "Profit Margin",
      value: `${(data.metrics.income ?? 0) > 0 ? (((data.metrics.net ?? 0) / (data.metrics.income ?? 0)) * 100).toFixed(1) : 0}%`,
      change: 0,
      icon: TrendingUp,
      trend: (data.metrics.net ?? 0) >= 0 ? "positive" : "negative",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Overview</h2>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="12m">12 Months</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {metric.trend === "positive" ? (
                  <TrendingUp className="h-4 w-4 text-accent" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    metric.trend === "positive" ? "text-accent" : "text-destructive",
                  )}
                >
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}%
                </span>
                <span className="text-sm text-muted-foreground">vs previous</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{data.narrative_overview}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
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
