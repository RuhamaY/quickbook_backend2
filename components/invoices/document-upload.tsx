"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAppData } from "@/contexts/app-data-context"
import { mockIncomingBills } from "@/lib/mock-data"

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const { addBill } = useAppData()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
      if (!validTypes.includes(selectedFile.type)) {
        setMessage("Please upload a PDF or image file (JPEG, PNG)")
        setStatus("error")
        return
      }
      setFile(selectedFile)
      setStatus("idle")
      setMessage("")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setStatus("uploading")
    setMessage("Uploading document...")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setStatus("processing")
      setMessage("Processing document with AI...")

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const randomBill = mockIncomingBills[Math.floor(Math.random() * mockIncomingBills.length)]

      const randomAmount = randomBill.totalAmount
      const randomVendor = randomBill.vendorName

      // Mock extracted data
      const extractedData = {
        vendorName: `${randomVendor} (OCR)`,
        totalAmount: randomAmount,
        invoiceDate: randomBill.invoiceDate,
        invoiceNumber: randomBill.invoiceNumber,
        dueDate: randomBill.dueDate,
      }

      setMessage("Creating bill...")

      await new Promise((resolve) => setTimeout(resolve, 500))

      const billId = "BILL-" + Math.floor(Math.random() * 10000)

      const vendorName = extractedData.vendorName || "Unknown Vendor"
      const amount = extractedData.totalAmount || 0
      const date = extractedData.invoiceDate || new Date().toISOString().split("T")[0]
      const docNum = extractedData.invoiceNumber || Math.floor(Math.random() * 1000).toString()
      const dueDate =
        extractedData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const newBill = {
        Id: billId,
        DocNumber: docNum,
        TxnDate: date,
        DueDate: dueDate,
        VendorRef: { name: vendorName, value: `vendor-${Math.floor(Math.random() * 1000)}` },
        TotalAmt: amount,
        Balance: amount, // Assume unpaid initially
        Status: "Open",
      }

      addBill(newBill)

      // Success!
      setStatus("success")
      setMessage(`Bill created successfully! ID: ${billId}. Please check the 'Bills' tab below.`)
      setFile(null)
    } catch (error) {
      console.error(error)
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Failed to process document")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice or Bill</CardTitle>
        <CardDescription>Upload a PDF or image to automatically extract and process the document</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <label
            htmlFor="file-upload"
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary transition-colors"
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">{file ? file.name : "Click to upload PDF or image"}</span>
            <span className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG (max 10MB)</span>
            <input
              id="file-upload"
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm flex-1">{file.name}</span>
            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        )}

        {message && (
          <Alert
            variant={status === "error" ? "destructive" : "default"}
            className={status === "success" ? "bg-green-50 border-green-200 text-green-800" : ""}
          >
            {status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {status === "error" && <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {status === "uploading" ? "Uploading..." : "Processing..."}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Process Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
