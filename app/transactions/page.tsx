import TransactionsHeader from "@/components/transactions/transactions-header"
import TransactionsView from "@/components/transactions/transactions-view"

export const metadata = {
  title: "Transactions - AI Bookkeeping Platform",
  description: "View and manage your transactions",
}

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TransactionsHeader />

      <main className="container mx-auto p-6">
        <TransactionsView />
      </main>
    </div>
  )
}
