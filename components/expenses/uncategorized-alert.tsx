"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"
import { useToast } from "@/hooks/use-toast"

export default function UncategorizedAlert() {
  const { expenses, autoCategorizeAll } = useAppData()
  const [isCategorizing, setIsCategorizing] = useState(false)
  const { toast } = useToast()

  const uncategorizedCount = expenses.filter((t) => {
    // Use line item's account name if available, otherwise fall back to top-level AccountRef
    const firstLine = t.Line && t.Line.length > 0 ? t.Line[0] : null
    const lineAccountRef = firstLine?.AccountBasedExpenseLineDetail?.AccountRef
    const category = lineAccountRef?.name || t.AccountRef?.name
    return !category || category === "Uncategorized" || category === "Unorganized"
  }).length

  if (uncategorizedCount === 0) return null

  const handleCategorizeAll = async () => {
    setIsCategorizing(true)
    try {
      await autoCategorizeAll()
      toast({
        title: "Categorization Complete",
        description: `Successfully processed ${uncategorizedCount} expenses.`,
      })
    } catch (error) {
      toast({
        title: "Categorization Failed",
        description: "Failed to process all expenses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCategorizing(false)
    }
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium">You have {uncategorizedCount} uncategorized expenses</p>
          </div>
          <Button size="sm" onClick={handleCategorizeAll} disabled={isCategorizing}>
            {isCategorizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Categorizing...
              </>
            ) : (
              "Categorize Now"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
