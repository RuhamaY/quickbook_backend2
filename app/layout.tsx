import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { AppDataProvider } from "@/contexts/app-data-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  title: "QuickBooks Online API - AI Bookkeeping Platform",
  description: "AI-powered bookkeeping platform with QuickBooks Online integration",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppDataProvider>
          {children}
          <Toaster />
        </AppDataProvider>
      </body>
    </html>
  )
}

