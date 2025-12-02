/**
 * API Client Utility
 * 
 * Centralized functions for all backend API calls with error handling
 * and response transformation to match frontend expectations
 */

import { API_ENDPOINTS } from "./api-config"

export interface ApiError {
  error: string
  status?: number
  details?: any
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = "API call failed"
      let errorDetails: any = null

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
        errorDetails = errorData
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

      return {
        error: {
          error: errorMessage,
          status: response.status,
          details: errorDetails,
        },
      }
    }

    const data = await response.json()
    return { data: data as T }
  } catch (error) {
    return {
      error: {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
    }
  }
}

/**
 * QuickBooks Entities API
 */
export const entitiesApi = {
  /**
   * List entities (customers, vendors, invoices, bills, purchases, etc.)
   */
  list: async (entity: string, params?: {
    where?: string
    orderby?: string
    start?: number
    max?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.where) queryParams.set("where", params.where)
    if (params?.orderby) queryParams.set("orderby", params.orderby)
    if (params?.start) queryParams.set("start", params.start.toString())
    if (params?.max) queryParams.set("max", params.max.toString())

    // Use the dynamic entity route /api/{entity}
    const url = `/api/${entity}${queryParams.toString() ? `?${queryParams}` : ""}`
    return fetchApi(url)
  },

  /**
   * Get entity by ID
   */
  getById: async (entity: string, id: string) => {
    const endpoint = API_ENDPOINTS[`${entity.toUpperCase()}_BY_ID` as keyof typeof API_ENDPOINTS]
    const url = typeof endpoint === "function" ? endpoint(id) : `/api/${entity}/${id}`
    return fetchApi(url)
  },
}

/**
 * Vendors API
 */
export const vendorsApi = {
  list: async (params?: { where?: string; orderby?: string; start?: number; max?: number }) => {
    return entitiesApi.list("vendors", params)
  },

  getById: async (id: string) => {
    return entitiesApi.getById("vendors", id)
  },

  search: async (query: string) => {
    const url = `${API_ENDPOINTS.VENDOR_SEARCH}?q=${encodeURIComponent(query)}`
    return fetchApi(url)
  },
}

/**
 * Customers API
 */
export const customersApi = {
  list: async (params?: { where?: string; orderby?: string; start?: number; max?: number }) => {
    return entitiesApi.list("customers", params)
  },

  getById: async (id: string) => {
    return entitiesApi.getById("customers", id)
  },

  search: async (query: string) => {
    const url = `${API_ENDPOINTS.CUSTOMER_SEARCH}?q=${encodeURIComponent(query)}`
    return fetchApi(url)
  },
}

/**
 * Invoices API
 */
export const invoicesApi = {
  list: async (params?: { where?: string; orderby?: string; start?: number; max?: number }) => {
    return entitiesApi.list("invoices", params)
  },

  getById: async (id: string) => {
    return entitiesApi.getById("invoices", id)
  },
}

/**
 * Bills API
 */
export const billsApi = {
  list: async (params?: { where?: string; orderby?: string; start?: number; max?: number }) => {
    return entitiesApi.list("bills", params)
  },

  getById: async (id: string) => {
    return entitiesApi.getById("bills", id)
  },

  createFromOCR: async (invoiceData: any) => {
    return fetchApi(API_ENDPOINTS.BILLS_FROM_OCR, {
      method: "POST",
      body: JSON.stringify(invoiceData),
    })
  },
}

/**
 * Transactions API
 */
export const transactionsApi = {
  /**
   * Get purchases (expenses/transactions)
   * Uses the purchases entity endpoint
   */
  list: async (params?: { where?: string; orderby?: string; start?: number; max?: number }) => {
    return entitiesApi.list("purchases", params)
  },

  getById: async (id: string) => {
    return entitiesApi.getById("purchases", id)
  },

  /**
   * Process a transaction from natural language
   */
  process: async (userMessage: string) => {
    return fetchApi(API_ENDPOINTS.TRANSACTIONS_PROCESS, {
      method: "POST",
      body: JSON.stringify({ user_message: userMessage }),
    })
  },

  /**
   * Recategorize a transaction (auto-detects category using AI)
   */
  recategorize: async (transactionId: string) => {
    return fetchApi(API_ENDPOINTS.TRANSACTIONS_RECATEGORIZE, {
      method: "POST",
      body: JSON.stringify({ transaction_id: transactionId }),
    })
  },
}

/**
 * Expenses API
 */
export const expensesApi = {
  /**
   * Get expense categories (accounts)
   */
  getCategories: async () => {
    return fetchApi(API_ENDPOINTS.EXPENSES)
  },
}

/**
 * Company API
 */
export const companyApi = {
  getInfo: async () => {
    return fetchApi(API_ENDPOINTS.COMPANY_INFO)
  },
}

/**
 * Payment Accounts API
 */
export const paymentAccountsApi = {
  get: async () => {
    return fetchApi(API_ENDPOINTS.PAYMENT_ACCOUNTS)
  },
}

/**
 * Query API
 */
export const queryApi = {
  execute: async (sql: string) => {
    const url = `${API_ENDPOINTS.QUERY}?sql=${encodeURIComponent(sql)}`
    return fetchApi(url)
  },
}

/**
 * Health API
 */
export const healthApi = {
  check: async () => {
    return fetchApi(API_ENDPOINTS.HEALTH)
  },
}

/**
 * Reports API
 */
export interface ReportResponse {
  id: string
  name: string
  result: {
    Output: {
      final_response: {
        request: {
          report_type: string
          start_date: string
          end_date: string
          format: string
          delivery_channel: string
        }
        report: {
          report_type: string
          period: {
            start_date: string
            end_date: string
          }
          totals: {
            income: number | null
            expenses: number | null
            net: number | null
          }
          top_expense_categories: Array<{
            name: string
            amount: number
          }>
          raw_report_payload: any
        }
      }
    }
  }
}

export const reportsApi = {
  /**
   * Generate a financial report (P&L, Balance Sheet, Cash Flow)
   * Returns JSON response
   */
  generate: async (params: {
    report_type: string
    start_date: string
    end_date: string
    format: string
    delivery_channel: string
  }): Promise<{ data?: ReportResponse; error?: ApiError }> => {
    try {
      const response = await fetch(API_ENDPOINTS.GENERATE_REPORT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          error: {
            error: errorText || `HTTP ${response.status}`,
            status: response.status,
          },
        }
      }

      // Try to parse as JSON first, fallback to text
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const json = await response.json()
        return { data: json }
      } else {
        // If it's text, try to parse it as JSON
        const text = await response.text()
        try {
          const json = JSON.parse(text)
          return { data: json }
        } catch {
          // If parsing fails, return as text (for backward compatibility)
          return { data: text as any }
        }
      }
    } catch (error) {
      return {
        error: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }
    }
  },
}

