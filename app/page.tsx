import type { Metadata } from "next"
import LandingPage from "@/components/landing-page"

export const metadata: Metadata = {
  title: "Welcome - AI Bookkeeping Platform",
  description: "Login to access your financial dashboard",
}

export default function Page() {
  return <LandingPage />
}

