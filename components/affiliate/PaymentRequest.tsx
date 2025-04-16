"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, AlertCircle, DollarSign } from "lucide-react"

interface PaymentRequestProps {
  pendingAmount: number
  onSuccess: () => void
}

export function PaymentRequest({ pendingAmount, onSuccess }: PaymentRequestProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requestPayment = async () => {
    if (pendingAmount <= 0) {
      toast.error("You don't have any pending earnings to withdraw")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/affiliate/payments", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to request payment")
      }

      toast.success("Payment request submitted successfully!")
      onSuccess()
    } catch (error) {
      toast.error(`Payment request failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Available for withdrawal</p>
            <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
          </div>
          
          <Button 
            onClick={requestPayment}
            disabled={isSubmitting || pendingAmount <= 0}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            {isSubmitting ? "Processing..." : "Request Payout"}
          </Button>
        </div>

        <div className="mt-4 text-sm">
          {pendingAmount <= 0 ? (
            <div className="flex items-center text-yellow-500 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4 mr-2" />
              You don&apos;t have any pending earnings to withdraw.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center text-green-600 dark:text-green-500">
                <Check className="h-4 w-4 mr-2" />
                Your payment will be processed within 5-7 business days.
              </div>
              <p className="text-muted-foreground">
                Payments are made via bank transfer to your registered account.
                Contact support if you need to update your payment details.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 