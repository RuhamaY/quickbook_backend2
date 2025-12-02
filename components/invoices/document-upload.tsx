"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAppData } from "@/contexts/app-data-context"
import { billsApi } from "@/lib/api-client"

// 1️⃣ Add this type here
interface QuickbooksBillData {
  quickbooks_bill_id?: string;
  quickbooks_raw_response?: {
    Bill?: {
      Id?: string;
    };
  };
  Bill?: {
    Id?: string;
  };
}

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] =
    useState<"idle" | "uploading" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const { addBill, refreshData } = useAppData()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
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

      // Convert to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(",")[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64 = await base64Promise
      setMessage("Processing document with AI...")

      // Submit to OCR endpoint
      const result = await billsApi.createFromOCR({
        vendor_name: "Unknown Vendor",
        invoice_number: "",
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: null,
        currency: "USD",
        line_items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        source: "OCR",
        file_url: `data:application/pdf;base64,${base64}`,
      })

      if (result.error) {
        throw new Error(result.error.error || "Failed to process document")
      }

      // 2️⃣ Safely cast data for TypeScript
      const data = result.data as QuickbooksBillData | undefined;

      // 3️⃣ Extract the bill ID safely
      const billId =
        data?.quickbooks_bill_id ??
        data?.quickbooks_raw_response?.Bill?.Id ??
        data?.Bill?.Id ??
        "Unknown"

      setMessage(`Bill created successfully! ID: ${billId}. Refreshing bills list...`)

      await refreshData()

      setStatus("success")
      setMessage(`Bill created successfully! ID: ${billId}. Check the 'Bills' tab below.`)
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
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Click to upload PDF or image"}
            </span>
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
            <span className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
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
