"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useAppData } from "@/contexts/app-data-context"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function VendorsList() {
  const { vendors, toggleVendorStatus, isLoading } = useAppData()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Tax ID</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.Id}>
                  <TableCell className="font-medium">{vendor.DisplayName}</TableCell>
                  <TableCell>{vendor.PrimaryEmailAddr?.Address || "—"}</TableCell>
                  <TableCell>{vendor.PrimaryPhone?.FreeFormNumber || "—"}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{vendor.TaxIdentifier}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(vendor.Balance || 0)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className={`h-auto p-0 hover:bg-transparent ${vendor.Active ? "" : "text-muted-foreground"}`}
                      onClick={() => toggleVendorStatus(vendor.Id)}
                    >
                      <Badge
                        variant={vendor.Active ? "default" : "secondary"}
                        className={`cursor-pointer ${!vendor.Active ? "bg-gray-200 text-gray-500 hover:bg-gray-300" : ""}`}
                      >
                        {vendor.Active ? "Active" : "Inactive"}
                      </Badge>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
