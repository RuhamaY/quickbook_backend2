"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, Receipt, Loader2, Calendar, DollarSign, User, Building2 } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function InvoicesList() {
  const [activeTab, setActiveTab] = useState<"invoices" | "bills">("invoices")
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [selectedBill, setSelectedBill] = useState<any | null>(null)
  const { invoices, bills, isLoading } = useAppData()

  // 🔧 Allow undefined and normalize inside
  const getStatusColor = (balance?: number, total?: number) => {
    const b = balance ?? 0
    const t = total ?? 0

    if (b === 0) return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
    if (b < t) return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
    return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
  }

  const getStatusText = (balance?: number, total?: number) => {
    const b = balance ?? 0
    const t = total ?? 0

    if (b === 0) return "Paid"
    if (b < t) return "Partial"
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
                        onClick={() => setSelectedInvoice(invoice)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
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
                          <p className="font-semibold text-lg">${(total ?? 0).toLocaleString()}</p>
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
                        onClick={() => setSelectedBill(bill)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">BILL-{bill.DocNumber || bill.Id}</span>
                            <Badge className={getStatusColor(balance, total)}>{status}</Badge>
                            {bill.Source === "OCR" && (
                              <Badge variant="outline" className="text-xs">OCR</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {bill.VendorRef?.name || "Unknown Vendor"}
                          </p>
                          {bill.DueDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(bill.DueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${(total ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(bill.TxnDate).toLocaleDateString()}
                          </p>
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

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice INV-{selectedInvoice.DocNumber}
                </DialogTitle>
                <DialogDescription>
                  Detailed information about this invoice
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status and Amount */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedInvoice.Balance, selectedInvoice.TotalAmt)}>
                      {getStatusText(selectedInvoice.Balance, selectedInvoice.TotalAmt)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">
                      ${selectedInvoice.TotalAmt?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {selectedInvoice.Balance > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Balance: ${selectedInvoice.Balance?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer and Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Customer
                    </div>
                    <p className="font-medium">{selectedInvoice.CustomerRef?.name || "Unknown"}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Transaction Date
                    </div>
                    <p className="font-medium">
                      {selectedInvoice.TxnDate
                        ? new Date(selectedInvoice.TxnDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  {selectedInvoice.DueDate && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due Date
                      </div>
                      <p className="font-medium">
                        {new Date(selectedInvoice.DueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedInvoice.CurrencyRef && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Currency
                      </div>
                      <p className="font-medium">
                        {selectedInvoice.CurrencyRef.name ||
                          selectedInvoice.CurrencyRef.value}
                      </p>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                {selectedInvoice.Line && selectedInvoice.Line.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Line Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.Line.map((line: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{line.Description || "N/A"}</TableCell>
                            <TableCell>
                              {line.SalesItemLineDetail?.Qty ||
                                line.Any?.find((a: any) => a.name === "Quantity")?.value ||
                                "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {line.SalesItemLineDetail?.UnitPrice
                                ? `$${parseFloat(
                                    line.SalesItemLineDetail.UnitPrice
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${parseFloat(line.Amount || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Notes */}
                {selectedInvoice.PrivateNote && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedInvoice.PrivateNote}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Invoice ID:</span> {selectedInvoice.Id}
                    </div>
                    {selectedInvoice.SyncToken && (
                      <div>
                        <span className="font-medium">Sync Token:</span> {selectedInvoice.SyncToken}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Detail Modal */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedBill && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Bill BILL-{selectedBill.DocNumber || selectedBill.Id}
                </DialogTitle>
                <DialogDescription>Detailed information about this bill</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status and Amount */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(selectedBill.Balance, selectedBill.TotalAmt)}>
                        {getStatusText(selectedBill.Balance, selectedBill.TotalAmt)}
                      </Badge>
                      {selectedBill.Source === "OCR" && (
                        <Badge variant="outline" className="text-xs">
                          OCR
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">
                      ${selectedBill.TotalAmt?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {selectedBill.Balance > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Balance: ${selectedBill.Balance?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vendor and Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Vendor
                    </div>
                    <p className="font-medium">
                      {selectedBill.VendorRef?.name || "Unknown Vendor"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Transaction Date
                    </div>
                    <p className="font-medium">
                      {selectedBill.TxnDate
                        ? new Date(selectedBill.TxnDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  {selectedBill.DueDate && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due Date
                      </div>
                      <p className="font-medium">
                        {new Date(selectedBill.DueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedBill.APAccountRef && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        AP Account
                      </div>
                      <p className="font-medium">
                        {selectedBill.APAccountRef.name || selectedBill.APAccountRef.value}
                      </p>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                {selectedBill.Line && selectedBill.Line.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Line Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBill.Line.map((line: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{line.Description || "N/A"}</TableCell>
                            <TableCell>
                              {line.AccountBasedExpenseLineDetail?.AccountRef?.name ||
                                line.ItemBasedExpenseLineDetail?.ItemRef?.name ||
                                "N/A"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${parseFloat(line.Amount || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Notes */}
                {selectedBill.PrivateNote && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedBill.PrivateNote}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Bill ID:</span> {selectedBill.Id}
                    </div>
                    {selectedBill.SyncToken && (
                      <div>
                        <span className="font-medium">Sync Token:</span> {selectedBill.SyncToken}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
