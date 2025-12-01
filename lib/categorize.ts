// Expense categorization helpers
import { SMYTHOS_CATEGORIZE_EXPENSE_URL, getSmythosApiKey, API_HOST, MINOR_VERSION } from "./config";
import { ensureTokens } from "./tokens";
import { withRefresh, qboGetById } from "./qbo";
import { resolveAccountIdFromName } from "./transactions";

export interface CategorizeExpenseRequest {
  vendor_name: string;
  amount: number;
  txn_date: string;
  description: string;
  raw_category_hint?: string;
}

/**
 * Calls SmythOS API to categorize an expense
 */
export async function categorizeExpenseWithSmythOS(
  request: CategorizeExpenseRequest
): Promise<string> {
  const apiKey = getSmythosApiKey();

  console.log("🏷️  [CATEGORIZE] Categorizing expense with SmythOS...");
  console.log("🏷️  [CATEGORIZE] Request:", request);

  if (!apiKey) {
    throw new Error("SMYTHOS_API_KEY is not set. Please set it in .env.local");
  }

  try {
    const response = await fetch(SMYTHOS_CATEGORIZE_EXPENSE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request),
    });

    console.log("🏷️  [CATEGORIZE] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [CATEGORIZE] Error response:", errorText);
      throw new Error(`SmythOS API error: ${response.status} - ${errorText}`);
    }

    // SmythOS returns text/plain
    const responseText = await response.text();
    console.log("🏷️  [CATEGORIZE] Raw response:", responseText);

    // Try to parse as JSON (it might be JSON in a text/plain response)
    let category: string;
    try {
      const parsed = JSON.parse(responseText);
      
      // Handle nested structure: result.Output.categorization_data.suggested_category
      if (parsed.result?.Output?.categorization_data?.suggested_category) {
        category = parsed.result.Output.categorization_data.suggested_category;
        console.log("✅ [CATEGORIZE] Extracted category from nested structure:", category);
      } else if (parsed.Output?.categorization_data?.suggested_category) {
        category = parsed.Output.categorization_data.suggested_category;
        console.log("✅ [CATEGORIZE] Extracted category from Output structure:", category);
      } else if (parsed.categorization_data?.suggested_category) {
        category = parsed.categorization_data.suggested_category;
        console.log("✅ [CATEGORIZE] Extracted category from categorization_data:", category);
      } else if (typeof parsed === "object") {
        // Fallback: try other common field names
        category =
          parsed.suggested_category ||
          parsed.category ||
          parsed.category_name ||
          parsed.name ||
          responseText;
        console.log("✅ [CATEGORIZE] Extracted category from fallback fields:", category);
      } else {
        category = parsed;
        console.log("✅ [CATEGORIZE] Using parsed value as category:", category);
      }
    } catch (parseError) {
      // If it's not JSON, use the text directly
      category = responseText.trim();
      console.log("✅ [CATEGORIZE] Using raw text as category:", category);
    }

    if (!category || category.trim() === "") {
      throw new Error("Could not extract category from SmythOS response");
    }

    console.log("✅ [CATEGORIZE] Final category:", category);
    return category.trim();
  } catch (error: any) {
    console.error("❌ [CATEGORIZE] Exception:", error);
    throw error;
  }
}

/**
 * Gets a purchase or expense from QuickBooks by ID
 * Tries purchase first, then expense if 404
 * Returns transaction data and whether it's an expense
 */
export async function getPurchaseOrExpenseById(
  transactionId: string
): Promise<{ transaction: Record<string, any>; isExpense: boolean }> {
  console.log("📥 [GET TRANSACTION] Fetching transaction:", transactionId);
  const tokens = await ensureTokens();

  // Try purchase first
  console.log("📥 [GET TRANSACTION] Trying purchase first...");
  let resp = await withRefresh(qboGetById, tokens, "purchase", transactionId);

  if (resp.ok) {
    const data = await resp.json();
    const transaction = data.Purchase || data.purchase || data;
    console.log("✅ [GET TRANSACTION] Transaction fetched as purchase");
    return { transaction, isExpense: false };
  }

  // If 404, try expense
  if (resp.status === 404) {
    console.log("📥 [GET TRANSACTION] Purchase not found (404), trying expense...");
    resp = await withRefresh(qboGetById, tokens, "expense", transactionId);

    if (resp.ok) {
      const data = await resp.json();
      const transaction = data.Expense || data.expense || data;
      console.log("✅ [GET TRANSACTION] Transaction fetched as expense");
      return { transaction, isExpense: true };
    }
  }

  // Both failed
  const errorText = await resp.text();
  console.error("❌ [GET TRANSACTION] Error:", resp.status, errorText);
  throw new Error(`Failed to get transaction (tried purchase and expense): ${resp.status} - ${errorText}`);
}

/**
 * Updates a purchase or expense in QuickBooks with a new category
 * Uses sparse update with operation=update
 */
export async function updatePurchaseOrExpenseCategory(
  currentTransaction: Record<string, any>,
  newAccountId: string,
  isExpense: boolean
): Promise<Record<string, any>> {
  console.log("🔄 [UPDATE CATEGORY] Updating transaction category...");
  console.log("🔄 [UPDATE CATEGORY] Transaction ID:", currentTransaction.Id);
  console.log("🔄 [UPDATE CATEGORY] New Account ID:", newAccountId);
  console.log("🔄 [UPDATE CATEGORY] Is Expense:", isExpense);

  if (!currentTransaction.Id || !currentTransaction.SyncToken) {
    throw new Error("Transaction missing Id or SyncToken");
  }

  // Build sparse update payload
  const updatePayload: Record<string, any> = {
    Id: currentTransaction.Id,
    SyncToken: currentTransaction.SyncToken,
    sparse: true,
    PaymentType: currentTransaction.PaymentType,
    Line: [],
  };

  // Update each line item with the new account
  if (currentTransaction.Line && Array.isArray(currentTransaction.Line)) {
    for (const line of currentTransaction.Line) {
      if (line.DetailType === "AccountBasedExpenseLineDetail") {
        const updatedLine: Record<string, any> = {
          Id: line.Id,
          Amount: line.Amount,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: newAccountId,
            },
          },
        };

        if (line.Description) {
          updatedLine.Description = line.Description;
        }

        updatePayload.Line.push(updatedLine);
      } else {
        // Keep non-expense lines as-is
        updatePayload.Line.push(line);
      }
    }
  }

  console.log(
    "🔄 [UPDATE CATEGORY] Update payload:",
    JSON.stringify(updatePayload, null, 2)
  );

  // Update the transaction using POST with operation=update parameter
  const tokens = await ensureTokens();
  const resource = isExpense ? "expense" : "purchase";
  
  // Create a custom update function that matches withRefresh signature
  // IMPORTANT: Only use operation=update, nothing else
  const updateFn = async (accessToken: string, realmId: string) => {
    const url = `${API_HOST}/v3/company/${realmId}/${resource}`;
    const params = new URLSearchParams({
      operation: "update", // ONLY operation=update, nothing else
      minorversion: MINOR_VERSION,
    });

    const fullUrl = `${url}?${params.toString()}`;
    console.log("🔄 [UPDATE CATEGORY] POST URL:", fullUrl);

    return fetch(fullUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });
  };
  
  // Use withRefresh wrapper to handle token refresh
  const response = await withRefresh(updateFn, tokens);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ [UPDATE CATEGORY] Error:", response.status, errorText);
    throw new Error(`Failed to update ${resource}: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("✅ [UPDATE CATEGORY] Transaction updated successfully");
  return data;
}

/**
 * Recategorizes a purchase or expense transaction
 * Auto-detects whether it's a purchase or expense
 */
export async function recategorizeTransaction(
  transactionId: string
): Promise<Record<string, any>> {
  console.log("🔄 [RECATEGORIZE] Starting recategorization...");
  console.log("🔄 [RECATEGORIZE] Transaction ID:", transactionId);

  // Step 1: Get the transaction from QuickBooks (auto-detects purchase vs expense)
  const { transaction, isExpense } = await getPurchaseOrExpenseById(transactionId);
  console.log("🔄 [RECATEGORIZE] Detected type:", isExpense ? "expense" : "purchase");

  // Step 2: Extract transaction details
  const vendorName =
    transaction.EntityRef?.name ||
    transaction.VendorRef?.name ||
    transaction.PayeeRef?.name ||
    "Unknown Vendor";

  const amount =
    transaction.Line?.reduce(
      (sum: number, line: any) => sum + (line.Amount || 0),
      0
    ) || 0;

  const txnDate = transaction.TxnDate || transaction.Date || "";

  const description =
    transaction.PrivateNote ||
    transaction.Description ||
    transaction.Memo ||
    transaction.Line?.[0]?.Description ||
    "";

  // Get current category from first line item
  const currentCategory =
    transaction.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name ||
    "";

  console.log("🔄 [RECATEGORIZE] Extracted details:", {
    vendorName,
    amount,
    txnDate,
    description,
    currentCategory,
  });

  // Step 3: Call SmythOS to categorize
  const categorizeRequest: CategorizeExpenseRequest = {
    vendor_name: vendorName,
    amount: amount,
    txn_date: txnDate,
    description: description,
    raw_category_hint: currentCategory,
  };

  let newCategory: string;
  try {
    newCategory = await categorizeExpenseWithSmythOS(categorizeRequest);
  } catch (error: any) {
    throw new Error(`Failed to categorize expense: ${error.message}`);
  }

  // Step 4: Resolve category name to account ID
  let newAccountId: string;
  try {
    newAccountId = await resolveAccountIdFromName(newCategory);
    if (!newAccountId) {
      throw new Error(`Could not resolve account ID for category: ${newCategory}`);
    }
    console.log("✅ [RECATEGORIZE] Resolved category to account ID:", newAccountId);
  } catch (error: any) {
    throw new Error(`Failed to resolve account ID: ${error.message}`);
  }

  // Step 5: Update the transaction
  let updatedTransaction: Record<string, any>;
  try {
    updatedTransaction = await updatePurchaseOrExpenseCategory(
      transaction,
      newAccountId,
      isExpense
    );
  } catch (error: any) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  console.log("✅ [RECATEGORIZE] Recategorization completed successfully");

  return {
    transaction_id: transactionId,
    old_category: currentCategory,
    new_category: newCategory,
    new_account_id: newAccountId,
    updated_transaction: updatedTransaction,
  };
}
