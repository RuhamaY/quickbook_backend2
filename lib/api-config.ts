/**
 * CENTRALIZED API CONFIGURATION
 *
 * Base URL and endpoint definitions for AI Bookkeeping Platform
 * All API calls must use these configurations
 */

// Use relative URLs since frontend and backend are in the same Next.js app
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api"
export const API_BASE_URL = "https://cmi64g4z2l90ept1sgpxlixmb.agent.a.smyth.ai"

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_START: `${BACKEND_URL}/auth/start`,
  AUTH_CALLBACK: `${BACKEND_URL}/auth/callback`,
  AUTH_TOKENS: `${BACKEND_URL}/auth/tokens`,

  // QuickBooks entity endpoints (using dynamic entity route)
  EXPENSES: `${BACKEND_URL}/expenses`,
  EXPENSE_BY_ID: (id: string) => `${BACKEND_URL}/expenses/${id}`,

  VENDORS: `${BACKEND_URL}/vendors`,
  VENDOR_BY_ID: (id: string) => `${BACKEND_URL}/vendors/${id}`,
  VENDOR_SEARCH: `${BACKEND_URL}/vendors/search`,

  CUSTOMERS: `${BACKEND_URL}/customers`,
  CUSTOMER_BY_ID: (id: string) => `${BACKEND_URL}/customers/${id}`,
  CUSTOMER_SEARCH: `${BACKEND_URL}/customers/search`,

  INVOICES: `${BACKEND_URL}/invoices`,
  INVOICE_BY_ID: (id: string) => `${BACKEND_URL}/invoices/${id}`,

  BILLS: `${BACKEND_URL}/bills`,
  BILL_BY_ID: (id: string) => `${BACKEND_URL}/bills/${id}`,
  BILLS_FROM_OCR: `${BACKEND_URL}/bills/from-ocr`,

  // Transactions
  TRANSACTIONS_PROCESS: `${BACKEND_URL}/transactions/process`,
  TRANSACTIONS_RECATEGORIZE: `${BACKEND_URL}/transactions/recategorize`,

  // Payment accounts
  PAYMENT_ACCOUNTS: `${BACKEND_URL}/payment-accounts`,

  // Query endpoint
  QUERY: `${BACKEND_URL}/query`,

  // Company info
  COMPANY_INFO: `${BACKEND_URL}/companyinfo`,

  // Health check
  HEALTH: `${BACKEND_URL}/health`,

  // Existing endpoints
  RECORD_QUICKBOOKS_TRANSACTION: `${API_BASE_URL}/api/record_quickbooks_transaction`,
  CATEGORIZE_EXPENSE: `${API_BASE_URL}/api/categorize_expense`,
  GENERATE_REPORT: `${API_BASE_URL}/api/generate_report`,
  PROCESS_INVOICE: `${API_BASE_URL}/api/process_invoice`,
  ASK_BOOKS: `${API_BASE_URL}/api/ask_books`,
  VENDOR_INSIGHTS: `${API_BASE_URL}/api/vendor_insights`,
  SUMMARIZE_OVERVIEW: `${API_BASE_URL}/api/summarize_overview`,
  EXECUTE_AGENT: `${API_BASE_URL}/execute`,
  RECORD_TRANSACTION_NLP: `${API_BASE_URL}/api/record_transaction_nlp`,
  PROCESS_DOCUMENT: `https://cmibggacvudrki1w959u2rb3g.agent.a.smyth.ai/api/process_document`,
  CREATE_BILL_FROM_FILE: `${BACKEND_URL}/bills/process-pdf`,
} as const

/**
 * Type definitions matching API schemas
 */

export interface RecordTransactionNLPRequest {
  description: string
  default_date: string
}

export interface RecordTransactionNLPResponse {
  id: string
  name: string
  result: {
    Output: {
      nlp_result: {
        status: string
        original_description: string
        parsed_transaction: {
          amount: number
          vendor_name: string
          txn_date: string
          memo: string
          category_hint: string
          currency: string
          payment_method: string
        }
        quickbooks_result: {
          transaction_id: string
          status: string
        }
      }
    }
  }
}

// /api/record_quickbooks_transaction
export interface RecordQuickBooksTransactionRequest {
  amount: number
  currency: string
  vendor_name: string
  txn_date: string // YYYY-MM-DD
  payment_method: string
  source: string
  memo: string
  category_hint: string
}

export interface RecordQuickBooksTransactionResponse {
  success: boolean
  quickbooks_txn_id?: string
  category_used?: string // category actually used by QuickBooks
  error?: string
}

// /api/categorize_expense
export interface CategorizeExpenseRequest {
  vendor_name: string
  amount: number
  description: string
  transaction_date: string // YYYY-MM-DD
  transaction_id: string | null
  raw_category_hint: string | null
}

export interface CategorizeExpenseResponse {
  suggested_category: string
  confidence: number
  reasoning: string
  should_auto_apply: boolean
  quickbooks_txn_id: string | null
  apply_status: string
  apply_error: string | null
  historical_sample_count: number
}

// /api/generate_report
export interface GenerateReportRequest {
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  granularity: "daily" | "weekly" | "monthly"
  focus: "summary" | "expenses" | "income" | "net" | "full"
  timezone: string // e.g., "America/Los_Angeles"
}

export interface GenerateReportResponse {
  normalized_date_range: {
    start: string
    end: string
  }
  granularity: string
  metrics: {
    income: number
    expenses: number
    net: number
    [key: string]: any
  }
  summary_narrative: string
}

// /api/process_invoice
export interface ProcessInvoiceRequest {
  pdf_base64: string
  match_existing_vendor: boolean
  vendor_name?: string
}

export interface ProcessInvoiceResponse {
  extracted_fields: Record<string, any>
  inferred_category: string
  created_bill?: any
  error?: string
}

// /api/ask_books
export interface AskBooksRequest {
  question: string
  date_range_start?: string
  date_range_end?: string
}

export interface AskBooksResponse {
  interpreted_intent: string
  financial_answer: string
  supporting_calculations: any
}

// /api/vendor_insights
export interface VendorInsightsRequest {
  vendor_query: string
  lookback_months: number
  max_results?: number
}

export interface VendorInsightsResponse {
  match: {
    query: string
    primary_vendor: string
    candidate_vendors: string[]
  }
  metrics: {
    total_spend: number
    transaction_count: number
    avg_transaction: number
    last_transaction_date: string
  }
  summary_text: string
}

// /api/summarize_overview
export interface SummarizeOverviewRequest {
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  granularity: "daily" | "weekly" | "monthly"
}

export interface SummarizeOverviewResponse {
  metrics: {
    income: number
    expenses: number
    net: number
    [key: string]: any
  }
  chart_data: any[]
  narrative_overview: string
}

export interface ProcessDocumentRequest {
  document_url: string
}

export interface ProcessDocumentResponse {
  extracted_data: string // JSON string that needs to be parsed
}

export interface CreateBillFromFileRequest {
  [key: string]: any // Dynamic structure from parsed document
}

export interface CreateBillFromFileResponse {
  success: boolean
  bill_id?: string
  error?: string
}

/**
 * API call helper function with error handling
 */
export async function apiCall<T>(endpoint: string, body: any): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorMessage = "API call failed"
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // ignore JSON parse errors and use default message
      }
      return { error: errorMessage }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
