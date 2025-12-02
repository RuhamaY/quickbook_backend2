"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Send, Loader2, CheckCircle2 } from "lucide-react"
import { recordNaturalLanguageTransaction } from "@/app/actions/record-natural-language-transaction"
import { useToast } from "@/hooks/use-toast"
import { useSWRConfig } from "swr"
import { useAppData } from "@/contexts/app-data-context" // Import useAppData

interface RecordTransactionModalProps {
  open: boolean
  onClose: () => void
}

export default function RecordTransactionModal({ open, onClose }: RecordTransactionModalProps) {
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()
  const { mutate } = useSWRConfig()
  const { addTransaction } = useAppData() // Use the context hook

  const handleSubmit = async () => {
    if (!input.trim()) return

    setIsProcessing(true)
    try {
      const result = await recordNaturalLanguageTransaction(input)

      if (result.success && result.transaction) {
        // Check for transaction
        setIsSuccess(true)

        // Add to app context to persist and update UI
        addTransaction(result.transaction)

        toast({
          title: "Transaction Recorded",
          description: "Your transaction has been successfully added.",
        })

        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to record transaction. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (isSuccess) {
      // Reset state when closing after success
      setIsSuccess(false)
      setInput("")
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Transaction</DialogTitle>
          <DialogDescription>Describe your transaction naturally. We'll handle the rest.</DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <div className="space-y-4 py-4">
            <div className="relative">
              <Textarea
                placeholder="e.g., Paid $150 to Staples for office supplies yesterday..."
                className="min-h-[120px] pr-10 resize-none text-lg"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-2 right-2 text-muted-foreground hover:text-primary"
                disabled={isProcessing}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!input.trim() || isProcessing} className="gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Record Transaction
                    <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Success!</h3>
              <p className="text-muted-foreground max-w-[300px] mx-auto">
                Transaction recorded successfully. It has been added to your lists.
              </p>
            </div>
            <Button onClick={handleClose} className="min-w-[120px]">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
