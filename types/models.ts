// TypeScript models equivalent to Python Pydantic models

export interface InvoiceLineItem {
  description?: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoiceIn {
  vendor_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null; // ISO date string
  due_date?: string | null; // ISO date string
  currency?: string | null;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  source?: string | null;
  original_subject?: string | null;
  sender_email?: string | null;
  file_url?: string | null;
}

export interface InvoiceProcessedOut {
  status: string;
  internal_invoice_id: string;
  vendor_name?: string | null;
  total: number;
  quickbooks_bill_id?: string | null;
  quickbooks_link?: string | null;
  quickbooks_raw_response?: Record<string, any> | null;
}

export interface Tokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  x_refresh_token_expires_in?: number;
  realm_id?: string;
  scope?: string;
}


