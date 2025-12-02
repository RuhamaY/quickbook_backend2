"use client"

/**
 * RECENT TRANSACTIONS COMPONENT
 *
 * API Call: GET /api/dashboard/recent-transactions
 * Response: {
 *   transactions: [
 *     {
 *       id: string,
 *       date: string,
 *       description: string,
 *       amount: number,
 *       type: 'income' | 'expense',
 *       category: string,
 *       status: 'completed' | 'pending'
 *     }
 *   ]
 * }
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { useAppData } from "@/contexts/app-data-context"

export default function RecentTransactions() {
  const { transactions } = useAppData()

  const recentTransactions = [...transactions]
    .filter((t) => t.TxnDate && !isNaN(new Date(t.TxnDate).getTime()))
    .sort((a, b) => new Date(b.TxnDate).getTime() - new Date(a.TxnDate).getTime())
    .slice(0, 5)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions">View all →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => {
            // Determine if transaction is income or expense based on amount
            const isIncome = (transaction.TotalAmt || 0) < 0
            const type = isIncome ? "income" : "expense"

            return (
              <div
                key={transaction.Id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      type === "income" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{transaction.EntityRef?.name || "Unknown Entity"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.TxnDate)}</p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.AccountRef?.name || "Uncategorized"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${type === "income" ? "text-accent" : "text-foreground"}`}>
                    {type === "income" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.TotalAmt || 0))}
                  </p>
                  <Badge variant={transaction.Status === "Cleared" ? "default" : "outline"} className="text-xs mt-1">
                    {transaction.Status || "Pending"}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function TransactionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}
