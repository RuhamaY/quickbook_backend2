"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppData } from "@/contexts/app-data-context"

export default function ExpensesList() {
  const { expenses, autoCategorizeExpense, isLoading } = useAppData()
  const [categorizing, setCategorizing] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCategorize = async (expense: any) => {
    setCategorizing(expense.Id)

    // Use line description if available, otherwise fall back to PrivateNote
    const firstLine = expense.Line && expense.Line.length > 0 ? expense.Line[0] : null
    const description = firstLine?.Description || expense.PrivateNote || expense.EntityRef?.name || "Unknown Expense"
    const category = await autoCategorizeExpense(expense.Id, description)

    toast({
      title: "Transaction Recorded",
      description: `Successfully recorded and categorized as ${category}.`,
    })

    setCategorizing(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => {
                // Get the first line item's account and description
                const firstLine = expense.Line && expense.Line.length > 0 ? expense.Line[0] : null
                const lineAccountRef = firstLine?.AccountBasedExpenseLineDetail?.AccountRef
                const category = lineAccountRef?.name || expense.AccountRef?.name
                const description = firstLine?.Description || expense.PrivateNote || "No description"
                const isUncategorized = !category || category === "Uncategorized"

                return (
                  <TableRow key={expense.Id}>
                    <TableCell>{expense.TxnDate}</TableCell>
                    <TableCell className="font-medium">{expense.EntityRef?.name || "Unknown"}</TableCell>
                    <TableCell>{description}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                        expense.TotalAmt || 0,
                      )}
                    </TableCell>
                    <TableCell>
                      {!isUncategorized ? (
                        <Badge variant="secondary">{category}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-dashed">
                          Uncategorized
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isUncategorized ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCategorize(expense)}
                          disabled={categorizing === expense.Id}
                        >
                          {categorizing === expense.Id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span className="text-primary text-xs">Auto-Categorize</span>
                          )}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">Audited</span>
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
