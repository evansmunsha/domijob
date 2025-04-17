 "use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface PaymentStatusSelectProps {
  paymentId: string
  initialStatus: string
}

export function PaymentStatusSelect({
  paymentId,
  initialStatus,
}: PaymentStatusSelectProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)

  const updatePaymentStatus = async (newStatus: string) => {
    if (newStatus === status) return

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/admin/affiliate/payments/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          paidAt: newStatus === "PAID" ? new Date().toISOString() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update payment status")
      }

      setStatus(newStatus)
      toast.success(`Payment status updated to ${newStatus}`)
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Select
      value={status}
      onValueChange={updatePaymentStatus}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              status === "PAID"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                : status === "PENDING"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                : status === "REJECTED"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
            }`}
          >
            {status}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PENDING">
          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-2 py-1 rounded-full text-xs">
            PENDING
          </span>
        </SelectItem>
        <SelectItem value="PROCESSING">
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full text-xs">
            PROCESSING
          </span>
        </SelectItem>
        <SelectItem value="PAID">
          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded-full text-xs">
            PAID
          </span>
        </SelectItem>
        <SelectItem value="REJECTED">
          <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 px-2 py-1 rounded-full text-xs">
            REJECTED
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}