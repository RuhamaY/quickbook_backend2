"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Sparkles, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { vendorsApi, transactionsApi } from "@/lib/api-client"

export default function VendorInsights() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    match: { primary_vendor: string }
    metrics: {
      total_spend: number
      transaction_count: number
      avg_transaction: number
      last_transaction_date: string
    }
    summary_text: string
    chart_data: any[]
  } | null>(null)

  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setData(null)

    try {
      // Search for vendors
      const vendorsResult = await vendorsApi.search(query)

      if (vendorsResult.error || !vendorsResult.data) {
        toast({
          title: "No vendor found",
          description: `We couldn't find any vendor matching "${query}".`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Extract vendor from search results (cast data so TS doesn't see it as `{}`)
      const vendorsResponse = (vendorsResult.data as any)?.QueryResponse
      const vendors = vendorsResponse?.Vendor ?? []

      if (vendors.length === 0) {
        toast({
          title: "No vendor found",
          description: `We couldn't find any vendor matching "${query}".`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const vendor = vendors[0]

      // Get transactions (purchases) for this vendor
      // Note: QuickBooks Purchase entity doesn't support EntityRef.value in WHERE clauses
      // So we fetch all purchases and filter client-side
      const transactionsResult = await transactionsApi.list({
        max: 100,
      })

      let vendorExpenses: any[] = []
      if (transactionsResult.data) {
        const purchasesResponse = (transactionsResult.data as any)?.QueryResponse
        const allPurchases = purchasesResponse?.Purchase ?? []

        // Filter purchases for this vendor client-side
        vendorExpenses = allPurchases.filter((purchase: any) => {
          const entityRef = purchase.EntityRef
          return (
            entityRef &&
            (entityRef.value === vendor.Id ||
              entityRef.name === vendor.DisplayName ||
              entityRef.name?.toLowerCase().includes(vendor.DisplayName.toLowerCase()))
          )
        })
      }

      if (vendorExpenses.length === 0) {
        // No transactions found for this vendor
        setData({
          match: { primary_vendor: vendor.DisplayName },
          metrics: {
            total_spend: vendor.Balance || 0,
            transaction_count: 0,
            avg_transaction: 0,
            last_transaction_date: "N/A",
          },
          summary_text: `Found vendor ${vendor.DisplayName} but no transactions yet.`,
          chart_data: [],
        })
        setLoading(false)
        return
      }

      const totalSpend = vendorExpenses.reduce(
        (sum, item) => sum + (item.TotalAmt || 0),
        0,
      )
      const count = vendorExpenses.length
      const avgTransaction = totalSpend / count

      const sortedMatches = [...vendorExpenses]
        .filter((t) => t.TxnDate && !isNaN(new Date(t.TxnDate).getTime()))
        .sort(
          (a, b) =>
            new Date(b.TxnDate).getTime() - new Date(a.TxnDate).getTime(),
        )

      const lastDate =
        sortedMatches.length > 0
          ? sortedMatches[0].TxnDate
          : new Date().toISOString().split("T")[0]

      const chartData = sortedMatches
        .slice(0, 10)
        .reverse()
        .map((item) => ({
          date: item.TxnDate,
          amount: item.TotalAmt || 0,
          label: item.TxnDate.slice(5), // MM-DD
        }))

      setData({
        match: { primary_vendor: vendor.DisplayName },
        metrics: {
          total_spend: totalSpend,
          transaction_count: count,
          avg_transaction: avgTransaction,
          last_transaction_date: lastDate,
        },
        summary_text: `Found ${count} transactions for ${vendor.DisplayName}. This vendor accounts for ${formatCurrency(
          totalSpend,
        )} in total spend, with an average transaction size of ${formatCurrency(
          avgTransaction,
        )}.`,
        chart_data: chartData,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full border-none shadow-md bg-gradient-to-br from-background to-slate-50/50 dark:from-background dark:to-slate-950/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI Vendor Insights</CardTitle>
        </div>
        <CardDescription>
          Search for any vendor to generate real-time spending analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter vendor name (e.g., Delta, Uber)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-background"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Generate Insight
              </>
            )}
          </Button>
        </form>

        {data ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Insight Box */}
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-sm">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full shrink-0">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    AI Analysis: {data.match.primary_vendor}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    {data.summary_text}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Spend
                </p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {formatCurrency(data.metrics.total_spend)}
                </p>
              </div>
              <div className="p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Transactions
                </p>
                <p className="text-2xl font-bold mt-1">
                  {data.metrics.transaction_count}
                </p>
              </div>
              <div className="p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Transaction
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(data.metrics.avg_transaction)}
                </p>
              </div>
              <div className="p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Seen
                </p>
                <p className="text-2xl font-bold mt-1">
                  {data.metrics.last_transaction_date}
                </p>
              </div>
            </div>

            <div className="h-[200px] w-full mt-4 p-4 bg-background border rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Recent Spending Trend
                </h4>
              </div>
              <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                <BarChart data={data.chart_data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {data.chart_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center h-32 text-center space-y-2 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              <Search className="h-8 w-8 opacity-20" />
              <p className="text-sm">
                Enter a vendor name above to see AI-powered insights
              </p>
            </div>
          )
        )}
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
