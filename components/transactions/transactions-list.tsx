"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"
import { useToast } from "@/hooks/use-toast"
import type { TransactionFiltersState } from "./transactions-view"

interface TransactionsListProps {
  filters: TransactionFiltersState
}

export default function TransactionsList({ filters }: TransactionsListProps) {
  const { transactions, recategorizePurchase } = useAppData()
  const [categorizing, setCategorizing] = useState<string | null>(null)
  const { toast } = useToast()
  const query = filters.searchQuery.toLowerCase()

  const handleCategorize = async (transactionId: string) => {
    setCategorizing(transactionId)
    try {
      await recategorizePurchase(transactionId)
      toast({
        title: "Transaction Categorized",
        description: "The transaction has been successfully categorized.",
      })
    } catch (error) {
      toast({
        title: "Categorization Failed",
        description: "Failed to categorize transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCategorizing(null)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    // Search filter
    if (query) {
      const matchesSearch =
        t.EntityRef?.name?.toLowerCase().includes(query) ||
        t.PrivateNote?.toLowerCase().includes(query) ||
        t.AccountRef?.name?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Date range filter
    if (filters.startDate) {
      const transactionDate = new Date(t.TxnDate)
      if (transactionDate < new Date(filters.startDate)) return false
    }
    if (filters.endDate) {
      const transactionDate = new Date(t.TxnDate)
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (transactionDate > endDate) return false
    }

    // Category filter
    if (filters.categories.length > 0) {
      const category = t.AccountRef?.name || "Uncategorized"
      if (!filters.categories.includes(category)) return false
    }

    // Payment type filter
    if (filters.paymentTypes.length > 0) {
      if (!filters.paymentTypes.includes(t.PaymentType)) return false
    }

    // Amount range filter
    const amount = Math.abs(t.TotalAmt || 0)
    if (filters.minAmount !== null && amount < filters.minAmount) return false
    if (filters.maxAmount !== null && amount > filters.maxAmount) return false

    return true
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          All Transactions{" "}
          {filteredTransactions.length < transactions.length && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              ({filteredTransactions.length} of {transactions.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No transactions found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => {
                const category = transaction.AccountRef?.name || "Uncategorized"
                const isUncategorized = !category || category === "Uncategorized" || category === "Unorganized"
                
                return (
                <TableRow key={transaction.Id}>
                  <TableCell>{transaction.TxnDate}</TableCell>
                  <TableCell className="font-medium">{transaction.EntityRef?.name || "Unknown Vendor"}</TableCell>
                  <TableCell>{transaction.PrivateNote || "No description"}</TableCell>
                  <TableCell>
                      <Badge variant={isUncategorized ? "outline" : "secondary"}>
                        {category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{transaction.PaymentType}</TableCell>
                  <TableCell className="text-right font-medium text-red-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(transaction.TotalAmt || 0)}
                  </TableCell>
                    <TableCell className="text-right">
                      {isUncategorized ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCategorize(transaction.Id)}
                          disabled={categorizing === transaction.Id}
                        >
                          {categorizing === transaction.Id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span className="text-primary text-xs">Categorize</span>
                          )}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">Categorized</span>
                      )}
                    </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
