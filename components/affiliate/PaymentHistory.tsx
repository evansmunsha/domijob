"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface Payment {
  id: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  paidAt?: string
  transactionId?: string
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/affiliate/payments")
        if (!response.ok) throw new Error("Failed to fetch payments")
        const data = await response.json()
        setPayments(data.payments)
        setError(null)
      } catch (err) {
        setError("Failed to load payment history")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const requestPayment = async () => {
    try {
      const response = await fetch("/api/affiliate/payments", {
        method: "POST"
      })
      if (!response.ok) throw new Error("Failed to request payment")
      const data = await response.json()
      setPayments(prev => [data.payment, ...prev])
    } catch (err) {
      console.error("Failed to request payment:", err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={requestPayment}>Request Payment</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid At</TableHead>
              <TableHead>Transaction ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{format(new Date(payment.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{payment.paymentMethod}</TableCell>
                <TableCell>
                  <Badge variant={payment.status === "PAID" ? "default" : "secondary"}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payment.paidAt
                    ? format(new Date(payment.paidAt), "MMM d, yyyy")
                    : "-"}
                </TableCell>
                <TableCell>{payment.transactionId || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 