"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Payment {
  id: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  paidAt: string | null
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/affiliate/payments")
        if (!response.ok) throw new Error("Failed to fetch payments")
        const data = await response.json()
        setPayments(data.payments || [])
      } catch (error) {
        console.error(error)
        toast.error("Failed to load payment history")
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading payment history...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No payment history yet.</p>
            <p className="text-sm mt-1">When you request a payout, it will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Date</th>
                  <th className="py-3 text-left font-medium">Amount</th>
                  <th className="py-3 text-left font-medium">Status</th>
                  <th className="py-3 text-left font-medium">Payment Method</th>
                  <th className="py-3 text-left font-medium">Paid Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3">{formatDate(payment.createdAt)}</td>
                    <td className="py-3">${payment.amount.toFixed(2)}</td>
                    <td className="py-3">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-3">{payment.paymentMethod}</td>
                    <td className="py-3">
                      {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 