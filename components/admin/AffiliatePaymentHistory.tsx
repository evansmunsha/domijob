"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface AffiliatePayment {
  id: string
  affiliateId: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string | Date
  updatedAt: string | Date
  paidAt: string | Date | null
  transactionId: string | null
}

interface AffiliatePaymentHistoryProps {
  payments: AffiliatePayment[]
  affiliateId: string
  onPaymentProcessed?: () => void
}

export default function AffiliatePaymentHistory({ 
  payments, 
  affiliateId,
  onPaymentProcessed 
}: AffiliatePaymentHistoryProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<AffiliatePayment | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const openProcessDialog = (payment: AffiliatePayment) => {
    setSelectedPayment(payment)
    setIsDialogOpen(true)
  }

  const handleProcessPayment = async (paymentId?: string) => {
    if (!paymentId) return
    
    try {
      setIsProcessing(true)
      
      const response = await fetch(`/api/admin/affiliate/payments/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PAID",
          paidAt: new Date().toISOString(),
          transactionId: `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to process payment")
      }
      
      toast.success("Payment processed successfully")
      setIsDialogOpen(false)
      
      if (onPaymentProcessed) {
        onPaymentProcessed()
      } else {
        // Refresh the page if no callback provided
        window.location.reload()
      }
    } catch (error) {
      toast.error("Failed to process payment")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "PAID":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Paid</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>No payment history available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-gray-500">
            No payment requests have been made by this affiliate yet.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage affiliate payment requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.status === "PENDING" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openProcessDialog(payment)}
                          disabled={isProcessing}
                        >
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Process Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this payment as processed?
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Amount:</p>
                  <p>{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Method:</p>
                  <p>{selectedPayment.paymentMethod}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleProcessPayment(selectedPayment?.id)} 
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}