"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, BarChart3, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"
import { loginWithMockUser } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      await loginWithMockUser()
      router.push("/dashboard")
    } catch (error) {
      console.error("Error logging in with Google:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Side - Content & Value Prop */}
      <div className="md:w-1/2 bg-slate-900 text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Abstract background pattern */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <h1 className="text-xl font-bold">Bookkeeper</h1>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">Financial clarity at the speed of AI.</h2>
            <p className="text-slate-300 text-lg md:text-xl max-w-md">
              Automate your bookkeeping, get real-time insights, and make smarter business decisions without the
              spreadsheet headaches.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg mt-1">
                  <Zap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Automated Transaction Recording</h3>
                  <p className="text-slate-400 text-sm">
                    Simply speak or type natural language to record expenses instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg mt-1">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Real-time Financial Dashboards</h3>
                  <p className="text-slate-400 text-sm">
                    Visualize cash flow, expenses, and trends with interactive charts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg mt-1">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure & Reliable</h3>
                  <p className="text-slate-400 text-sm">Enterprise-grade security for your sensitive financial data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 md:mt-0 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">Trusted by over 500+ small businesses</p>
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-slate-700 border-2 border-slate-900"></div>
              <div className="h-8 w-8 rounded-full bg-slate-600 border-2 border-slate-900"></div>
              <div className="h-8 w-8 rounded-full bg-slate-500 border-2 border-slate-900"></div>
              <div className="h-8 w-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-medium">
                +500
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full flex items-center justify-center gap-3 h-14 text-base font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {isLoading ? "Signing in..." : "Continue with Google"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Secure Access</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-slate-900">New to AI Bookkeeper?</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your account will be automatically created when you sign in. No credit card required for the starter
                    plan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-slate-400">
              By clicking continue, you agree to our{" "}
              <Link href="#" className="underline hover:text-slate-600">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-slate-600">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
