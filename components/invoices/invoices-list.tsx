"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, Receipt, Loader2 } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"

export default function InvoicesList() {
  const [activeTab, setActiveTab] = useState<"invoices" | "bills">("invoices")
  const [isLoading, setIsLoading] = useState(true)
  const { invoices, bills } = useAppData()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getStatusColor = (balance: number, total: number) => {
    if (balance === 0) return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
    if (balance < total) return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
    return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
  }

  const getStatusText = (balance: number, total: number) => {
    if (balance === 0) return "Paid"
    if (balance < total) return "Partial"
    return "Unpaid"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "invoices" | "bills")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Bills ({bills.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No invoices found</p>
                ) : (
                  invoices.map((invoice) => {
                    const balance = invoice.Balance
                    const total = invoice.TotalAmt
                    const status = getStatusText(balance, total)

                    return (
                      <div
                        key={invoice.Id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">INV-{invoice.DocNumber}</span>
                            <Badge className={getStatusColor(balance, total)}>{status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{invoice.CustomerRef?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(invoice.DueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${total.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.TxnDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bills" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {bills.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bills found</p>
                ) : (
                  bills.map((bill) => {
                    const balance = bill.Balance
                    const total = bill.TotalAmt
                    const status = getStatusText(balance, total)

                    return (
                      <div
                        key={bill.Id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">BILL-{bill.DocNumber}</span>
                            <Badge className={getStatusColor(balance, total)}>{status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{bill.VendorRef?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(bill.DueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${total.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(bill.TxnDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
