 "use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PaymentActionButtonsProps {
  paymentId: string
}

export function PaymentActionButtons({ paymentId }: PaymentActionButtonsProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const updatePaymentStatus = async (status: string) => {
    const isProcessAction = status === "PROCESSING"
    
    if (isProcessAction) {
      setIsProcessing(true)
    } else {
      setIsRejecting(true)
    }
    
    try {
      const response = await fetch(`/api/admin/affiliate/payments/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update payment status")
      }

      toast.success(`Payment ${isProcessAction ? "marked for processing" : "rejected"}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      if (isProcessAction) {
        setIsProcessing(false)
      } else {
        setIsRejecting(false)
      }
    }
  }

  return (
    <div className="flex gap-4">
      <Button
        variant="default"
        onClick={() => updatePaymentStatus("PROCESSING")}
        disabled={isProcessing || isRejecting}
      >
        {isProcessing ? "Processing..." : "Process Payment"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={isProcessing || isRejecting}
          >
            {isRejecting ? "Rejecting..." : "Reject Payment"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will reject the payment request and notify the affiliate. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updatePaymentStatus("REJECTED")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}