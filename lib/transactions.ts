// Transaction processing helpers
import {
  SMYTHOS_TRANSACTION_URL,
  getSmythosApiKey,
  getExpenseAccountId,
  getPaymentAccountId,
} from "./config";
import { ensureTokens } from "./tokens";
import { withRefresh, qboPost, qboQuery } from "./qbo";
import { resolveVendorIdFromQBO } from "./bills";

export interface TransactionData {
  vendor_name?: string;
  vendor?: string;
  amount?: number;
  date?: string;
  description?: string;
  account?: string;
  account_id?: string;
  category?: string;
  expense_account?: string;
  expense_account_id?: string;
  payment_type?: string;
  payment_method?: string;
  reference_number?: string;
  line_items?: Array<{
    description?: string;
    amount?: number;
    account?: string;
    account_id?: string;
  }>;
  quickbooksPayload?: Record<string, any>; // kept for debugging, not used to POST
  [key: string]: any;
}

/**
 * Calls SmythOS API to process a natural language transaction
 */
export async function processTransactionWithSmythOS(
  userMessage: string
): Promise<TransactionData> {
  const apiKey = getSmythosApiKey();

  console.log("💬 [SMYTHOS TRANSACTION] Processing transaction description...");
  console.log("💬 [SMYTHOS TRANSACTION] User message:", userMessage);
  console.log("💬 [SMYTHOS TRANSACTION] API Key:", apiKey ? "SET" : "MISSING");

  if (!apiKey) {
    throw new Error("SMYTHOS_API_KEY is not set. Please set it in .env.local");
  }

  try {
    const response = await fetch(SMYTHOS_TRANSACTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        user_message: userMessage,
      }),
    });

    console.log("💬 [SMYTHOS TRANSACTION] Response status:", response.status);
    console.log(
      "💬 [SMYTHOS TRANSACTION] Response content-type:",
      response.headers.get("content-type")
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [SMYTHOS TRANSACTION] Error response:", errorText);
      throw new Error(`SmythOS API error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log(
      "💬 [SMYTHOS TRANSACTION] Raw response (first 500 chars):",
      responseText.substring(0, 500)
    );

    let data: TransactionData;
    try {
      data = JSON.parse(responseText);
      console.log("✅ [SMYTHOS TRANSACTION] Response parsed as JSON");
    } catch (parseError) {
      console.log(
        "⚠️  [SMYTHOS TRANSACTION] Response is not JSON, attempting to extract JSON..."
      );
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
          console.log("✅ [SMYTHOS TRANSACTION] Extracted JSON from text response");
        } catch (e) {
          throw new Error(`Could not parse JSON from SmythOS response: ${e}`);
        }
      } else {
        throw new Error("No JSON found in SmythOS response");
      }
    }

    console.log("✅ [SMYTHOS TRANSACTION] Transaction processed successfully");
    console.log("💬 [SMYTHOS TRANSACTION] Response keys:", Object.keys(data));
    return data;
  } catch (error: any) {
    console.error("❌ [SMYTHOS TRANSACTION] Exception:", error);
    throw error;
  }
}

/**
 * Resolves account ID from account name in QuickBooks
 */
export async function resolveAccountIdFromName(
  accountName: string
): Promise<string> {
  if (!accountName) {
    return "";
  }

  console.log("🔍 [RESOLVE ACCOUNT] Looking for account:", accountName);
  const tokens = await ensureTokens();

  // Clean up account name (remove "Expense" suffix if present, handle "ExpensesExpense" pattern)
  let cleanName = accountName.replace(/Expenses?Expense$/, "").trim();
  cleanName = cleanName.replace(/Expense$/, "").trim();

  // Try exact match first
  let where = `Name = '${cleanName.replace(/'/g, "''")}'`;
  let sql = `select * from Account where ${where} startposition 1 maxresults 1`;

  const resp = await withRefresh(qboQuery, tokens, sql);

  if (!resp.ok) {
    console.error("❌ [RESOLVE ACCOUNT] Query failed:", resp.status);
    return "";
  }

  try {
    const data = await resp.json();
    const accounts = data?.QueryResponse?.Account || [];
    if (accounts.length > 0) {
      const accountId = accounts[0].Id || "";
      console.log("✅ [RESOLVE ACCOUNT] Found account with ID:", accountId);
      return accountId;
    }

    // Try with "like" query if exact match fails (handles variations)
    console.log("🔄 [RESOLVE ACCOUNT] Exact match failed, trying like query...");
    where = `Name like '${cleanName.replace(/'/g, "''")}%'`;
    sql = `select * from Account where ${where} startposition 1 maxresults 1`;
    const resp2 = await withRefresh(qboQuery, tokens, sql);

    if (resp2.ok) {
      const data2 = await resp2.json();
      const accounts2 = data2?.QueryResponse?.Account || [];
      if (accounts2.length > 0) {
        const accountId = accounts2[0].Id || "";
        console.log(
          "✅ [RESOLVE ACCOUNT] Found account with like query, ID:",
          accountId
        );
        return accountId;
      }
    }

    console.log("⚠️  [RESOLVE ACCOUNT] Account not found");
    return "";
  } catch (error) {
    console.error("❌ [RESOLVE ACCOUNT] Error parsing response:", error);
    return "";
  }
}

/**
 * Finds a payment account (Cash, Bank, Credit Card) for Purchase transactions
 * Returns the first available payment account ID
 */
export async function findPaymentAccount(): Promise<string> {
  console.log("🔍 [FIND PAYMENT ACCOUNT] Looking for payment account...");
  const tokens = await ensureTokens();

  // Query for payment accounts: Bank, Other Current Asset (for Cash), Credit Card
  const sql = `select Id, Name, AccountType, AccountSubType from Account 
    where (AccountType = 'Bank' or AccountType = 'Other Current Asset' or AccountType = 'Credit Card')
    and (Name = 'Cash' or Name like 'Cash%' or Name = 'Checking' or Name like 'Checking%' or Name = 'Bank' or Name like 'Bank%')
    startposition 1 maxresults 10`;

  const resp = await withRefresh(qboQuery, tokens, sql);

  if (!resp.ok) {
    console.error("❌ [FIND PAYMENT ACCOUNT] Query failed:", resp.status);
    return "";
  }

  try {
    const data = await resp.json();
    const accounts = data?.QueryResponse?.Account || [];

    if (accounts.length === 0) {
      console.log(
        "⚠️  [FIND PAYMENT ACCOUNT] No payment accounts found with specific names, trying broader search..."
      );

      // Broader search: any Bank or Other Current Asset account
      const broadSql = `select Id, Name, AccountType from Account 
        where (AccountType = 'Bank' or AccountType = 'Other Current Asset')
        startposition 1 maxresults 5`;

      const broadResp = await withRefresh(qboQuery, tokens, broadSql);
      if (broadResp.ok) {
        const broadData = await broadResp.json();
        const broadAccounts = broadData?.QueryResponse?.Account || [];
        if (broadAccounts.length > 0) {
          const accountId = broadAccounts[0].Id || "";
          console.log(
            "✅ [FIND PAYMENT ACCOUNT] Found payment account (broad search):",
            broadAccounts[0].Name,
            accountId
          );
          return accountId;
        }
      }

      console.error("❌ [FIND PAYMENT ACCOUNT] No payment accounts found in QuickBooks");
      return "";
    }

    // Prefer Cash, then Checking, then Bank
    const preferredOrder = ["Cash", "Checking", "Bank"];
    for (const preferred of preferredOrder) {
      const found = accounts.find(
        (acc: any) =>
          acc.Name && acc.Name.toLowerCase().startsWith(preferred.toLowerCase())
      );
      if (found) {
        const accountId = found.Id || "";
        console.log(
          "✅ [FIND PAYMENT ACCOUNT] Found preferred payment account:",
          found.Name,
          accountId
        );
        return accountId;
      }
    }

    // Return first available
    const accountId = accounts[0].Id || "";
    console.log(
      "✅ [FIND PAYMENT ACCOUNT] Found payment account:",
      accounts[0].Name,
      accountId
    );
    return accountId;
  } catch (error) {
    console.error("❌ [FIND PAYMENT ACCOUNT] Error parsing response:", error);
    return "";
  }
}

/**
 * Organizes and validates transaction data from SmythOS
 * Returns both organized data and (optional) raw quickbooks_payload for debugging
 */
export async function organizeTransactionData(smythosData: any): Promise<{
  transaction: TransactionData;
  quickbooksPayload?: Record<string, any>;
}> {
  console.log("🔄 [ORGANIZE] Organizing transaction data...");
  console.log("🔄 [ORGANIZE] Input keys:", Object.keys(smythosData));

  let transactionJson: any = null;
  let quickbooksPayload: Record<string, any> | undefined = undefined;

  // Try to extract transaction_json from nested structure
  if (smythosData.result?.Output?.transaction_data?.transaction_json) {
    const jsonString = smythosData.result.Output.transaction_data.transaction_json;
    console.log("🔄 [ORGANIZE] Found transaction_json in nested structure");
    try {
      const parsed = JSON.parse(jsonString);
      console.log("✅ [ORGANIZE] Parsed transaction_json");

      if (parsed.quickbooks_payload) {
        quickbooksPayload = parsed.quickbooks_payload;
        console.log("✅ [ORGANIZE] Found quickbooks_payload in transaction_json");
      }

      if (parsed.extracted_transaction) {
        transactionJson = parsed.extracted_transaction;
        console.log("✅ [ORGANIZE] Using extracted_transaction");
      } else {
        transactionJson = parsed;
      }
    } catch (e) {
      console.warn("⚠️  [ORGANIZE] Could not parse transaction_json:", e);
    }
  }

  // Fallback: structured_data or raw
  let transactionData: any = transactionJson || smythosData;

  if (!transactionJson && smythosData.structured_data) {
    if (typeof smythosData.structured_data === "string") {
      try {
        transactionData = JSON.parse(smythosData.structured_data);
        console.log("✅ [ORGANIZE] Parsed structured_data JSON string");
      } catch (e) {
        console.warn(
          "⚠️  [ORGANIZE] Could not parse structured_data, using original"
        );
        transactionData = smythosData;
      }
    } else {
      transactionData = smythosData.structured_data;
      console.log("✅ [ORGANIZE] Using structured_data object");
    }
  }

  const organized: TransactionData = {
    vendor_name: transactionData.vendor_name || transactionData.vendor || null,
    amount: parseFloat(transactionData.amount?.toString() || "0"),
    date:
      transactionData.date ||
      transactionData.transaction_date ||
      transactionData.txn_date ||
      null,
    description:
      transactionData.description ||
      transactionData.desc ||
      transactionData.note ||
      transactionData.memo ||
      null,
    account:
      transactionData.account ||
      transactionData.expense_account ||
      transactionData.category_hint ||
      null,
    account_id:
      transactionData.account_id || transactionData.expense_account_id || null,
    category:
      transactionData.category_hint ||
      transactionData.category ||
      transactionData.account ||
      null,
    payment_type:
      transactionData.payment_type || transactionData.payment_method || null,
    reference_number:
      transactionData.reference_number ||
      transactionData.ref_number ||
      transactionData.reference ||
      null,
    line_items: transactionData.line_items || transactionData.items || [],
  };

  // Validate required fields
  if (!organized.vendor_name) {
    if (quickbooksPayload?.VendorRef?.name) {
      organized.vendor_name = quickbooksPayload.VendorRef.name;
      console.log(
        "✅ [ORGANIZE] Extracted vendor_name from quickbooks_payload (for debugging)"
      );
    } else {
      throw new Error("Vendor name is required but not found in transaction data");
    }
  }

  if (
    organized.amount === 0 &&
    (!organized.line_items || organized.line_items.length === 0)
  ) {
    if (quickbooksPayload?.Line && Array.isArray(quickbooksPayload.Line)) {
      const totalAmount = quickbooksPayload.Line.reduce(
        (sum: number, line: any) => sum + (line.Amount || 0),
        0
      );
      if (totalAmount > 0) {
        organized.amount = totalAmount;
        console.log(
          "✅ [ORGANIZE] Extracted amount from quickbooks_payload for debugging:",
          totalAmount
        );
      }
    }

    if (
      organized.amount === 0 &&
      (!organized.line_items || organized.line_items.length === 0)
    ) {
      throw new Error("Transaction amount is required but not found in data");
    }
  }

  console.log("✅ [ORGANIZE] Transaction data organized");
  console.log("🔄 [ORGANIZE] Vendor:", organized.vendor_name);
  console.log("🔄 [ORGANIZE] Amount:", organized.amount);
  console.log("🔄 [ORGANIZE] Date:", organized.date);
  console.log("🔄 [ORGANIZE] Account:", organized.account);
  console.log("🔄 [ORGANIZE] Category:", organized.category);
  console.log("🔄 [ORGANIZE] Has quickbooks_payload:", !!quickbooksPayload);

  // We return quickbooksPayload for debugging, but we won't POST it directly to QBO.
  return {
    transaction: organized,
    quickbooksPayload,
  };
}

// Normalize payment type into QBO-accepted values
function normalizePaymentType(raw?: string): "Cash" | "Check" | "CreditCard" {
  const v = (raw || "").toLowerCase();
  if (v.includes("check")) return "Check";
  if (v.includes("card")) return "CreditCard";
  return "Cash";
}

/**
 * Builds a clean QuickBooks Purchase payload from normalized transaction data.
 * We DO NOT trust or reuse the agent's quickbooks_payload structure here.
 */
export async function buildQboPurchaseFromTransaction(
  transaction: TransactionData,
  vendorId: string,
  expenseAccountId: string
): Promise<Record<string, any>> {
  console.log("📝 [BUILD PURCHASE] Building QuickBooks Purchase payload (clean)...");

  if (!vendorId) {
    throw new Error("Vendor ID is required to create a QuickBooks Purchase");
  }
  if (!expenseAccountId) {
    throw new Error("Expense Account ID is required to create a QuickBooks Purchase");
  }

  // Resolve expense account ID from transaction if it specified a nicer account name
  let accountIdToUse = expenseAccountId;

  if (transaction.account && !transaction.account_id) {
    console.log(
      "🔍 [BUILD PURCHASE] Resolving expense account name to ID:",
      transaction.account
    );
    const resolved = await resolveAccountIdFromName(transaction.account);
    if (resolved) {
      accountIdToUse = resolved;
      console.log("✅ [BUILD PURCHASE] Using resolved expense account ID:", accountIdToUse);
    }
  } else if (transaction.account_id) {
    accountIdToUse = transaction.account_id;
  }

  // Build line items
  const lineItems: any[] = [];
  if (transaction.line_items && transaction.line_items.length > 0) {
    for (const item of transaction.line_items) {
      let itemAccountId = item.account_id || accountIdToUse;

      if (item.account && !item.account_id) {
        const resolved = await resolveAccountIdFromName(item.account);
        if (resolved) {
          itemAccountId = resolved;
        }
      }

      lineItems.push({
        DetailType: "AccountBasedExpenseLineDetail",
        Amount: parseFloat(item.amount?.toString() || "0"),
        Description: item.description || "",
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: itemAccountId,
          },
        },
      });
    }
  } else {
    // Single-line fallback
    lineItems.push({
      DetailType: "AccountBasedExpenseLineDetail",
      Amount: transaction.amount || 0,
      Description: transaction.description || "Transaction",
      AccountBasedExpenseLineDetail: {
        AccountRef: {
          value: accountIdToUse,
        },
      },
    });
  }

  // Use configured payment account ID from environment
  const paymentAccountId = getPaymentAccountId();
  if (!paymentAccountId) {
    throw new Error(
      "PAYMENT_ACCOUNT_ID (or QB_PAYMENT_ACCOUNT_ID) is not set in environment variables. " +
        "Please set it to a Bank/Cash/Credit Card account ID in .env.local"
    );
  }
  console.log("✅ [BUILD PURCHASE] Using configured payment account ID:", paymentAccountId);

  const paymentType = normalizePaymentType(transaction.payment_type);

  const purchase: Record<string, any> = {
    PaymentType: paymentType,
    AccountRef: {
      value: paymentAccountId,
    },
    EntityRef: {
      value: vendorId, // Payee; for Purchase this is EntityRef
    },
    Line: lineItems,
  };

  if (transaction.date) {
    purchase.TxnDate = transaction.date;
  }

  // PrivateNote: prefer reference_number, else description
  if (transaction.reference_number) {
    purchase.PrivateNote = `Reference: ${transaction.reference_number}`;
  } else if (transaction.description) {
    purchase.PrivateNote = transaction.description;
  }

  console.log(
    "✅ [BUILD PURCHASE] Purchase payload built (clean).",
    JSON.stringify(purchase, null, 2)
  );
  return purchase;
}

/**
 * Creates a Purchase transaction in QuickBooks
 * NOTE: This expects a normalized TransactionData, not a raw agent payload.
 */
export async function createPurchaseInQBO(
  transaction: TransactionData
): Promise<Record<string, any>> {
  console.log("💰 [CREATE PURCHASE] Creating purchase in QuickBooks...");

  const expenseAccountId = getExpenseAccountId();
  if (!expenseAccountId) {
    throw new Error(
      "EXPENSE_ACCOUNT_ID is not set. Please set it in .env.local or config"
    );
  }

  const vendorName = transaction.vendor_name;
  if (!vendorName) {
    throw new Error("Vendor name is required to create a Purchase");
  }

  // Resolve or create vendor
  let vendorId: string;
  try {
    vendorId = await resolveVendorIdFromQBO(vendorName, true); // createIfMissing = true
    if (!vendorId) {
      throw new Error("Failed to resolve or create vendor");
    }
    console.log("✅ [CREATE PURCHASE] Vendor resolved/created with ID:", vendorId);
  } catch (error: any) {
    console.error("❌ [CREATE PURCHASE] Error resolving/creating vendor:", error);
    throw new Error(`Could not resolve or create vendor: ${error.message}`);
  }

  // Build a clean purchase payload from our normalized transaction
  const purchasePayload = await buildQboPurchaseFromTransaction(
    transaction,
    vendorId,
    expenseAccountId
  );

  console.log(
    "🧾 [CREATE PURCHASE] Final Purchase payload to QBO:",
    JSON.stringify(purchasePayload, null, 2)
  );

  const tokens = await ensureTokens();
  const resp = await withRefresh(qboPost, tokens, "purchase", purchasePayload);

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error(
      "❌ [CREATE PURCHASE] QuickBooks API error:",
      resp.status,
      errorText
    );
    let errorData: any;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new Error(
      `QuickBooks API error: ${resp.status} - ${JSON.stringify(errorData)}`
    );
  }

  const qboData = await resp.json();
  console.log("✅ [CREATE PURCHASE] Purchase created successfully");
  return qboData;
}
