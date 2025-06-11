 "use client"

import { cn } from "@/lib/utils"

interface PaymentStatusBadgeProps {
  status: string
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium",
        status === "PAID" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        status === "PENDING" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        status === "PROCESSING" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        status === "REJECTED" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      )}
    >
      {status}
    </span>
  )
}