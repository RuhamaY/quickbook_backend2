"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { logout as logoutAction } from "@/app/actions/auth"
import { recordNaturalLanguageTransaction } from "@/app/actions/record-natural-language-transaction"
import { transactionsApi, vendorsApi, customersApi, invoicesApi, billsApi } from "@/lib/api-client"

// Define types based on QuickBooks API structure
export interface Transaction {
  Id: string
  TxnDate: string
  TotalAmt: number
  PrivateNote?: string
  EntityRef?: { value: string; name: string }
  AccountRef?: { value?: string; name: string }
  PaymentType?: string
  Status?: string
  [key: string]: any
}

export interface Invoice {
  Id: string
  DocNumber?: string
  TxnDate: string
  DueDate?: string
  CustomerRef?: { value: string; name: string }
  TotalAmt: number
  Balance?: number
  Status?: string
  [key: string]: any
}

export interface Bill {
  Id: string
  DocNumber?: string
  TxnDate: string
  DueDate?: string
  VendorRef?: { value: string; name: string }
  TotalAmt: number
  Balance?: number
  Status?: string
  [key: string]: any
}

export interface Vendor {
  Id: string
  DisplayName: string
  PrimaryEmailAddr?: { Address?: string }
  PrimaryPhone?: { FreeFormNumber?: string }
  Balance?: number
  Active?: boolean
  TaxIdentifier?: string
  [key: string]: any
}

export interface Customer {
  Id: string
  DisplayName: string
  PrimaryEmailAddr?: { Address?: string }
  PrimaryPhone?: { FreeFormNumber?: string }
  Balance?: number
  Active?: boolean
  Address?: string
  [key: string]: any
}

export interface User {
  name: string
  email: string
  avatar: string
}

interface AppDataContextType {
  user: User | null
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  transactions: Transaction[]
  expenses: Transaction[]
  invoices: Invoice[]
  bills: Bill[]
  vendors: Vendor[]
  customers: Customer[]
  isLoading: boolean
  error: string | null
  addTransaction: (transaction: Transaction) => void
  addBill: (Bill: Bill) => void
  addInvoice: (invoice: Invoice) => void
  updateExpenseCategory: (id: string, category: string) => void
  toggleVendorStatus: (id: string) => void
  autoCategorizeExpense: (id: string, description: string) => Promise<string>
  autoCategorizeAll: () => Promise<void>
  recategorizePurchase: (transactionId: string) => Promise<string>
  recategorizeAllPurchases: () => Promise<void>
  refreshData: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize state as empty arrays - will be populated from API
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to extract entities from QuickBooks QueryResponse format
  const extractEntities = <T,>(response: any, entityKey: string): T[] => {
    if (!response?.data) return []
    const queryResponse = response.data.QueryResponse || response.data
    return queryResponse[entityKey] || queryResponse[entityKey + "s"] || []
  }

  // Fetch data from APIs
  const fetchAllData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch transactions (purchases)
      const transactionsResult = await transactionsApi.list({ max: 100 })
      if (transactionsResult.data) {
        const purchases = extractEntities<Transaction>(transactionsResult, "Purchase")
        setTransactions(purchases)
      } else if (transactionsResult.error) {
        console.error("Failed to fetch transactions:", transactionsResult.error)
      }

      // Fetch vendors
      const vendorsResult = await vendorsApi.list({ max: 100 })
      if (vendorsResult.data) {
        const vendorsList = extractEntities<Vendor>(vendorsResult, "Vendor")
        setVendors(vendorsList)
      } else if (vendorsResult.error) {
        console.error("Failed to fetch vendors:", vendorsResult.error)
      }

      // Fetch customers
      const customersResult = await customersApi.list({ max: 100 })
      if (customersResult.data) {
        const customersList = extractEntities<Customer>(customersResult, "Customer")
        setCustomers(customersList)
      } else if (customersResult.error) {
        console.error("Failed to fetch customers:", customersResult.error)
      }

      // Fetch invoices
      const invoicesResult = await invoicesApi.list({ max: 100 })
      if (invoicesResult.data) {
        const invoicesList = extractEntities<Invoice>(invoicesResult, "Invoice")
        setInvoices(invoicesList)
      } else if (invoicesResult.error) {
        console.error("Failed to fetch invoices:", invoicesResult.error)
      }

      // Fetch bills
      const billsResult = await billsApi.list({ max: 100 })
      if (billsResult.data) {
        const billsList = extractEntities<Bill>(billsResult, "Bill")
        setBills(billsList)
      } else if (billsResult.error) {
        console.error("Failed to fetch bills:", billsResult.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data"
      setError(errorMessage)
      console.error("Error fetching data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initialize user if we are on a protected route or have local storage
    const storedAuth = localStorage.getItem("isAuthenticated")
    if (storedAuth === "true" || pathname?.startsWith("/dashboard")) {
      setIsAuthenticated(true)
      setUser({
        name: "User",
        email: "user@example.com",
        avatar: "/placeholder.svg?height=32&width=32",
      })
      // Fetch data when authenticated
      if (!isLoaded) {
        fetchAllData()
      }
    }

    setIsLoaded(true)
  }, [pathname]) // Fetch data when pathname changes and user is authenticated

  // Refetch data when authentication state changes
  useEffect(() => {
    if (isAuthenticated && isLoaded) {
      fetchAllData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      // Optionally cache data in localStorage for offline access
      try {
      localStorage.setItem("transactions", JSON.stringify(transactions))
      localStorage.setItem("invoices", JSON.stringify(invoices))
      localStorage.setItem("bills", JSON.stringify(bills))
      localStorage.setItem("vendors", JSON.stringify(vendors))
      localStorage.setItem("customers", JSON.stringify(customers))
      } catch (e) {
        console.error("Failed to cache data:", e)
      }

      if (isAuthenticated) {
        localStorage.setItem("isAuthenticated", "true")
      } else {
        localStorage.removeItem("isAuthenticated")
      }
    }
  }, [transactions, invoices, bills, vendors, customers, isLoaded, isAuthenticated])

  useEffect(() => {
    if (isLoaded && !isAuthenticated && pathname !== "/") {
      router.push("/")
    } else if (isLoaded && isAuthenticated && pathname === "/") {
      router.push("/dashboard")
    }
  }, [isLoaded, isAuthenticated, pathname, router])

  const login = () => {
    setIsAuthenticated(true)
    setUser({
      name: "User",
      email: "user@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    })
    // Fetch data after login
    fetchAllData()
    router.push("/dashboard")
  }

  const logout = async () => {
    await logoutAction()

    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("isAuthenticated")
    // logoutAction handles redirect
  }

  // Expenses are just transactions with negative amounts (or type 'expense')
  // In our mock data, we use the same array, but logically expenses are a subset or the same list
  // We'll derive it from transactions to keep them in sync
  const expenses = transactions

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev])
  }

  const addBill = (bill: Bill) => {
    setBills((prev) => [bill, ...prev])
  }

  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev])
  }

  const updateExpenseCategory = (id: string, category: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.Id === id ? { ...t, AccountRef: { ...t.AccountRef, name: category } } : t)),
    )
  }

  const toggleVendorStatus = (id: string) => {
    setVendors((prev) => prev.map((v) => (v.Id === id ? { ...v, Active: !v.Active } : v)))
  }

  const autoCategorizeExpense = async (id: string, description: string): Promise<string> => {
    try {
      const result = await recordNaturalLanguageTransaction(description)

      if (result.success && result.transaction) {
        const category = result.transaction.AccountRef.name
        updateExpenseCategory(id, category)
        return category
      }
      return "Uncategorized"
    } catch (error) {
      console.error("Failed to auto-categorize:", error)
      return "Uncategorized"
    }
  }

  const autoCategorizeAll = async () => {
    const uncategorized = transactions.filter((t) => {
      const category = t.AccountRef?.name
      return !category || category === "Uncategorized" || category === "Unorganized"
    })

    // Process in parallel with a limit or just parallel since it's a few items
    await Promise.all(
      uncategorized.map(async (t) => {
        const description = t.PrivateNote || t.EntityRef?.name || "Unknown Expense"
        await autoCategorizeExpense(t.Id, description)
      }),
    )
  }

  const recategorizePurchase = async (transactionId: string): Promise<string> => {
    try {
      const { transactionsApi } = await import("@/lib/api-client")
      const result = await transactionsApi.recategorize(transactionId)
      if (result.error) {
        console.error("Failed to recategorize:", result.error)
        return "Uncategorized"
      }
      // Refresh data after recategorization
      await refreshData()
      return "Success"
    } catch (error) {
      console.error("Failed to recategorize purchase:", error)
      return "Uncategorized"
    }
  }

  const recategorizeAllPurchases = async () => {
    const uncategorized = transactions.filter((t) => {
      const category = t.AccountRef?.name
      return !category || category === "Uncategorized" || category === "Unorganized"
    })

    await Promise.all(
      uncategorized.map(async (t) => {
        await recategorizePurchase(t.Id)
      }),
    )

    // Refresh data after all recategorizations
    await refreshData()
  }

  const refreshData = async () => {
    // Clear cached data and fetch fresh from API
    localStorage.removeItem("transactions")
    localStorage.removeItem("invoices")
    localStorage.removeItem("bills")
    localStorage.removeItem("vendors")
    localStorage.removeItem("customers")
    await fetchAllData()
  }

  return (
    <AppDataContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        transactions,
        expenses,
        invoices,
        bills,
        vendors,
        customers,
        isLoading,
        error,
        addTransaction,
        addBill,
        addInvoice,
        updateExpenseCategory,
        toggleVendorStatus,
        autoCategorizeExpense,
        autoCategorizeAll,
        recategorizePurchase,
        recategorizeAllPurchases,
        refreshData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider")
  }
  return context
}
