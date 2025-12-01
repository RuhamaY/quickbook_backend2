// Configuration constants

// Helper function to get env vars (reads at runtime, not module load time)
function getEnv(key: string, defaultValue: string = ""): string {
  const value = process.env[key] || defaultValue;
  // Log when env var is missing (only once per key)
  if (!value && defaultValue === "") {
    console.warn(`⚠️  [CONFIG] Environment variable ${key} is not set`);
  }
  return value;
}

// Public env vars (available on client and server)
export const REDIRECT_URI = getEnv("NEXT_PUBLIC_REDIRECT_URI", "https://quickbook-backend-eta.vercel.app/api/auth/callback");
export const SCOPE = "com.intuit.quickbooks.accounting";
export const AUTH_BASE_URL = "https://appcenter.intuit.com/connect/oauth2";
export const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
export const API_HOST = "https://sandbox-quickbooks.api.intuit.com"; // Sandbox for Dev keys
export const TOKENS_FILE = "tokens.json";
export const MINOR_VERSION = "75"; // QBO minor version (safe default)

// SmythOS document processing
export const SMYTHOS_URL = "https://cmibggacvudrki1w959u2rb3g.agent.a.smyth.ai/api/process_document";
export const SMYTHOS_TRANSACTION_URL = "https://cmibggacvudrki1w959u2rb3g.agent.a.smyth.ai/api/process_transaction";
export const SMYTHOS_CATEGORIZE_EXPENSE_URL = "https://cmibggacvudrki1w959u2rb3g.agent.a.smyth.ai/api/categorize_expense";
export const INVOICE_STORAGE_DIR = "invoices"; // Local folder for uploaded invoices

// Server-side only environment variables
export function getClientId(): string {
  return getEnv("CLIENT_ID");
}

export function getClientSecret(): string {
  return getEnv("CLIENT_SECRET");
}

export function getSmythosApiKey(): string {
  return getEnv("SMYTHOS_API_KEY");
}

export function getApAccountId(): string {
  return getEnv("AP_ACCOUNT_ID");
}

export function getExpenseAccountId(): string {
  return getEnv("EXPENSE_ACCOUNT_ID");
}

// For backward compatibility, export as constants (but they read at runtime)
export const CLIENT_ID = getClientId();
export const CLIENT_SECRET = getClientSecret();
export const SMYTHOS_API_KEY = getSmythosApiKey();
export const AP_ACCOUNT_ID = getApAccountId();
export const EXPENSE_ACCOUNT_ID = getExpenseAccountId();

export function getPaymentAccountId(): string {
  const id = getEnv("PAYMENT_ACCOUNT_ID") || getEnv("QB_PAYMENT_ACCOUNT_ID");
  if (!id) {
    console.warn(
      "⚠️  [CONFIG] PAYMENT_ACCOUNT_ID (or QB_PAYMENT_ACCOUNT_ID) is not set. " +
        "Set this to a Bank/Cash/Credit Card account ID in QuickBooks."
    );
  }
  return id || "";
}

// Log configuration on startup (only in development)
if (process.env.NODE_ENV !== "production") {
  console.log("⚙️  [CONFIG] Configuration loaded:");
  console.log(
    "⚙️  [CONFIG] CLIENT_ID:",
    CLIENT_ID ? `${CLIENT_ID.substring(0, 10)}...` : "❌ MISSING"
  );
  console.log("⚙️  [CONFIG] CLIENT_SECRET:", CLIENT_SECRET ? "✅ SET" : "❌ MISSING");
  console.log("⚙️  [CONFIG] REDIRECT_URI:", REDIRECT_URI);
  console.log("⚙️  [CONFIG] API_HOST:", API_HOST);
  console.log("⚙️  [CONFIG] AP_ACCOUNT_ID:", AP_ACCOUNT_ID || "❌ NOT SET");
  console.log("⚙️  [CONFIG] EXPENSE_ACCOUNT_ID:", EXPENSE_ACCOUNT_ID || "❌ NOT SET");
  console.log("⚙️  [CONFIG] PAYMENT_ACCOUNT_ID:", getPaymentAccountId() || "❌ NOT SET");
  console.log("⚙️  [CONFIG] All env vars:", {
    CLIENT_ID: !!CLIENT_ID,
    CLIENT_SECRET: !!CLIENT_SECRET,
    NEXT_PUBLIC_REDIRECT_URI: !!process.env.NEXT_PUBLIC_REDIRECT_URI,
    AP_ACCOUNT_ID: !!AP_ACCOUNT_ID,
    EXPENSE_ACCOUNT_ID: !!EXPENSE_ACCOUNT_ID,
    PAYMENT_ACCOUNT_ID: !!getPaymentAccountId(),
  });
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ [CONFIG] Missing CLIENT_ID or CLIENT_SECRET in environment variables");
  console.error("❌ [CONFIG] Make sure .env.local exists and contains CLIENT_ID and CLIENT_SECRET");
  console.error("❌ [CONFIG] Restart the server after creating/editing .env.local");
}

// Entity mapping for QuickBooks API
export const ENTITY_MAP: Record<string, [string, string]> = {
  customers: ["Customer", "customer"],
  vendors: ["Vendor", "vendor"],
  items: ["Item", "item"],
  accounts: ["Account", "account"],
  invoices: ["Invoice", "invoice"],
  bills: ["Bill", "bill"],
  payments: ["Payment", "payment"],
  purchases: ["Purchase", "purchase"], // expense transactions
  employees: ["Employee", "employee"],
  estimates: ["Estimate", "estimate"],
  credit_memos: ["CreditMemo", "creditmemo"],
  journal_entries: ["JournalEntry", "journalentry"],
  classes: ["Class", "class"],
  departments: ["Department", "department"],
  taxcodes: ["TaxCode", "taxcode"],
};
