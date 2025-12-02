"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import TransactionFilters from "@/components/transactions/transaction-filters"
import TransactionsList from "@/components/transactions/transactions-list"
import { useAppData } from "@/contexts/app-data-context"

export interface TransactionFiltersState {
  searchQuery: string
  startDate: string
  endDate: string
  categories: string[]
  paymentTypes: string[]
  minAmount: number | null
  maxAmount: number | null
}

export default function TransactionsView() {
  const [filters, setFilters] = useState<TransactionFiltersState>({
    searchQuery: "",
    startDate: "",
    endDate: "",
    categories: [],
    paymentTypes: [],
    minAmount: null,
    maxAmount: null,
  })
  
  const { transactions, recategorizeAllPurchases } = useAppData()
  const [isCategorizingAll, setIsCategorizingAll] = useState(false)
  const { toast } = useToast()

  const uncategorizedCount = transactions.filter((t) => {
    const category = t.AccountRef?.name
    return !category || category === "Uncategorized" || category === "Unorganized"
  }).length

  const handleCategorizeAll = async () => {
    if (uncategorizedCount === 0) return
    
    setIsCategorizingAll(true)
    try {
      await recategorizeAllPurchases()
      toast({
        title: "Categorization Complete",
        description: `Successfully categorized ${uncategorizedCount} transactions.`,
      })
    } catch (error) {
      toast({
        title: "Categorization Failed",
        description: "Failed to categorize all transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCategorizingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {uncategorizedCount > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  You have {uncategorizedCount} uncategorized transaction{uncategorizedCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click below to automatically categorize them using AI
                </p>
              </div>
              <Button size="sm" onClick={handleCategorizeAll} disabled={isCategorizingAll}>
                {isCategorizingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Categorizing...
                  </>
                ) : (
                  "Categorize All"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <TransactionFilters filters={filters} onFiltersChange={setFilters} />
      <TransactionsList filters={filters} />
    </div>
  )
}
