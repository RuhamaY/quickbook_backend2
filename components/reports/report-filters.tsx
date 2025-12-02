"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Loader2 } from "lucide-react" // Added Loader2 import
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export interface ReportFilters {
  report_type: string
  start_date: string
  end_date: string
  format: string
  delivery_channel: string
}

interface ReportFiltersProps {
  onGenerate: (filters: ReportFilters) => void
  data?: any
  isLoading?: boolean // Added isLoading prop
}

export default function ReportFilters({ onGenerate, data, isLoading }: ReportFiltersProps) {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [reportType, setReportType] = useState("profit_loss")

  const handleQuickRange = (range: "month" | "quarter" | "year") => {
    const end = new Date()
    const start = new Date()

    if (range === "month") {
      start.setMonth(start.getMonth() - 1)
    } else if (range === "quarter") {
      start.setMonth(start.getMonth() - 3)
    } else {
      start.setFullYear(start.getFullYear() - 1)
    }

    setStartDate(start.toISOString().split("T")[0])
    setEndDate(end.toISOString().split("T")[0])
  }

  const [format, setFormat] = useState("text")
  const [deliveryChannel, setDeliveryChannel] = useState("api")

  const handleGenerate = () => {
    onGenerate({
      report_type: reportType,
      start_date: startDate,
      end_date: endDate,
      format: format,
      delivery_channel: deliveryChannel,
    })
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit_loss">Profit & Loss</SelectItem>
                <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                <SelectItem value="cash_flow">Cash Flow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="delivery-channel">Delivery Channel</Label>
            <Select value={deliveryChannel} onValueChange={setDeliveryChannel}>
              <SelectTrigger id="delivery-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleQuickRange("month")}>
              Last Month
            </Button>
            <Button variant="outline" onClick={() => handleQuickRange("quarter")}>
              Last Quarter
            </Button>
            <Button variant="outline" onClick={() => handleQuickRange("year")}>
              Last Year
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
