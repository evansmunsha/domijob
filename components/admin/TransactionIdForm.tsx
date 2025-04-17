 "use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"

interface TransactionIdFormProps {
  paymentId: string
}

export function TransactionIdForm({ paymentId }: TransactionIdFormProps) {
  const router = useRouter()
  const [transactionId, setTransactionId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!transactionId.trim()) {
      toast.error("Transaction ID is required")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/admin/affiliate/payments/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PAID",
          transactionId,
          paidAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to complete payment")
      }

      toast.success("Payment marked as completed")
      router.refresh()
    } catch (error) {
      console.error("Error completing payment:", error)
      toast.error(`Failed to complete payment: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transactionId">Transaction ID</Label>
        <Input
          id="transactionId"
          placeholder="Enter payment transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Enter the transaction ID or reference number from your payment platform.
        </p>
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Processing..." : "Mark as Paid"}
      </Button>
    </form>
  )
}