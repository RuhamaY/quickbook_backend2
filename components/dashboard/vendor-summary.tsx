"use client"

/**
 * VENDOR SUMMARY COMPONENT
 *
 * API Call: GET /api/vendor-insights?summary=true
 * Response: {
 *   topVendors: [
 *     { name: string, totalSpend: number, transactionCount: number, insights: string[] }
 *   ]
 * }
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Building2, Loader2 } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"

export default function VendorSummary() {
  const { vendors, transactions, isLoading } = useAppData()

  if (isLoading) return <VendorSkeleton />

  // Calculate top vendors by total spend
  const vendorSpend = new Map<string, { name: string; totalSpend: number; transactionCount: number }>()
  
  transactions.forEach((txn) => {
    const vendorId = txn.EntityRef?.value || txn.EntityRef?.name || "unknown"
    const vendorName = txn.EntityRef?.name || "Unknown Vendor"
    const amount = Math.abs(txn.TotalAmt || 0)
    
    if (!vendorSpend.has(vendorId)) {
      vendorSpend.set(vendorId, { name: vendorName, totalSpend: 0, transactionCount: 0 })
    }
    
    const current = vendorSpend.get(vendorId)!
    current.totalSpend += amount
    current.transactionCount += 1
  })

  const topVendors = Array.from(vendorSpend.values())
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Vendors</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vendors">View all →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topVendors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No vendor data available</p>
          ) : (
            topVendors.map((vendor) => (
            <div
              key={vendor.name}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{vendor.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{vendor.transactionCount} transactions</p>
                <p className="text-sm font-medium text-primary mt-1">{formatCurrency(vendor.totalSpend)}</p>
              </div>
            </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function VendorSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
