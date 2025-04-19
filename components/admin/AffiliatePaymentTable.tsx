"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { MoreHorizontal, Check, X, Clock, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type AffiliateUser = {
  id: string
  name: string
  email: string
  image: string | null
}

type Affiliate = {
  id: string
  user: AffiliateUser
  code: string
  paymentMethod: string
  paypalEmail: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
}

type AffiliatePayment = {
  id: string
  amount: number
  status: "PENDING" | "PROCESSING" | "PAID" | "REJECTED"
  paymentMethod: string
  createdAt: string
  updatedAt: string
  paidAt: string | null
  transactionId: string | null
  affiliate: Affiliate
}

type PaymentStatusColor = {
  [key: string]: string
}

type AffiliatePaymentTableProps = {
  payments: AffiliatePayment[]
  onProcessed: () => void
}

export function AffiliatePaymentTable({ payments, onProcessed }: AffiliatePaymentTableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<AffiliatePayment | null>(null)
  const [transactionId, setTransactionId] = useState("")
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const router = useRouter()

  const statusColors: PaymentStatusColor = {
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300",
    PROCESSING: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300",
    PAID: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "PROCESSING":
        return <Clock className="h-4 w-4" />
      case "PAID":
        return <Check className="h-4 w-4" />
      case "REJECTED":
        return <X className="h-4 w-4" />
      default:
        return null
    }
  }

  const openProcessDialog = (payment: AffiliatePayment) => {
    setSelectedPayment(payment)
    setTransactionId("")
    setShowProcessDialog(true)
  }

  const openRejectDialog = (payment: AffiliatePayment) => {
    setSelectedPayment(payment)
    setShowRejectDialog(true)
  }

  const handleStatusUpdate = async (paymentId: string, status: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/affiliate/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentId,
          status,
          transactionId: transactionId || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update payment status")
      }

      toast.success(`Payment marked as ${status.toLowerCase()}`)
      onProcessed()
      closeAllDialogs()
      router.refresh()
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const closeAllDialogs = () => {
    setShowProcessDialog(false)
    setShowRejectDialog(false)
    setSelectedPayment(null)
  }

  const renderPaymentMethodDetails = (payment: AffiliatePayment) => {
    if (payment.paymentMethod === "PAYPAL") {
      return (
        <div className="text-sm">
          <span className="font-medium">PayPal:</span> {payment.affiliate.paypalEmail}
        </div>
      )
    }

    if (payment.paymentMethod === "BANK") {
      return (
        <div className="text-sm space-y-1">
          <div><span className="font-medium">Bank:</span> {payment.affiliate.bankName}</div>
          <div><span className="font-medium">Account:</span> {payment.affiliate.accountName}</div>
          <div><span className="font-medium">Number:</span> {payment.affiliate.accountNumber}</div>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request Date</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No payment requests found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{payment.affiliate.user.name}</div>
                    <div className="text-xs text-muted-foreground">{payment.affiliate.user.email}</div>
                    <div className="text-xs text-muted-foreground">ID: {payment.affiliate.code}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {renderPaymentMethodDetails(payment)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`flex items-center gap-1 ${statusColors[payment.status]}`}
                    >
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </Badge>
                    {payment.paidAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Paid {new Date(payment.paidAt).toLocaleDateString()}
                      </div>
                    )}
                    {payment.transactionId && (
                      <div className="text-xs mt-1 flex items-center gap-1">
                        <span className="text-muted-foreground">Tx:</span> 
                        <span className="font-mono text-xs">{payment.transactionId}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {payment.status === "PENDING" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(payment.id, "PROCESSING")}
                            >
                              Mark as Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openProcessDialog(payment)}
                            >
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openRejectDialog(payment)}
                            >
                              Reject Payment
                            </DropdownMenuItem>
                          </>
                        )}
                        {payment.status === "PROCESSING" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => openProcessDialog(payment)}
                            >
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openRejectDialog(payment)}
                            >
                              Reject Payment
                            </DropdownMenuItem>
                          </>
                        )}
                        {(payment.status === "PAID" || payment.status === "REJECTED") && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(payment.id, "PENDING")}
                          >
                            Reset to Pending
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Process Payment Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Mark this payment as paid and add transaction details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="font-medium">Payment Details</div>
              <div className="text-sm text-muted-foreground">
                <div>Amount: ${selectedPayment?.amount.toFixed(2)}</div>
                <div>
                  Method: {selectedPayment?.paymentMethod} - 
                  {selectedPayment?.paymentMethod === "PAYPAL" ? 
                    selectedPayment?.affiliate.paypalEmail : 
                    `${selectedPayment?.affiliate.bankName} / ${selectedPayment?.affiliate.accountName}`
                  }
                </div>
                <div>Affiliate: {selectedPayment?.affiliate.user.name}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction reference"
              />
              <p className="text-sm text-muted-foreground">
                Add a transaction ID or reference number for this payment
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedPayment && handleStatusUpdate(selectedPayment.id, "PAID")}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Processing..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Rejecting this payment will return the amount to the affiliate's pending balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              <div>Amount: ${selectedPayment?.amount.toFixed(2)}</div>
              <div>Affiliate: {selectedPayment?.affiliate.user.name}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPayment && handleStatusUpdate(selectedPayment.id, "REJECTED")}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Processing..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 