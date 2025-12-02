"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CustomerInsights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">AI-powered customer insights...</p>
      </CardContent>
    </Card>
  )
}
