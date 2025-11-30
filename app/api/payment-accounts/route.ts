import { NextResponse } from "next/server";

/**
 * Returns the configured payment account(s) from env variables.
 *
 * Later you can replace this with a real QuickBooks call if you want,
 * but this already makes the route "real" and lets your build succeed.
 */
export async function GET() {
  try {
    const paymentAccountId = process.env.PAYMENT_ACCOUNT_ID;
    const apAccountId = process.env.AP_ACCOUNT_ID;
    const expenseAccountId = process.env.EXPENSE_ACCOUNT_ID;

    if (!paymentAccountId) {
      return NextResponse.json(
        { error: "PAYMENT_ACCOUNT_ID is not configured in environment" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        paymentAccountId,
        apAccountId: apAccountId ?? null,
        expenseAccountId: expenseAccountId ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/payment-accounts:", err);
    return NextResponse.json(
      { error: "Failed to load payment accounts" },
      { status: 500 }
    );
  }
}
