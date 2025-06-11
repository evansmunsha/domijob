"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Check, X, ClipboardCopy, AlertTriangle } from "lucide-react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Steps, Step } from "@/components/ui/steps"

interface Payment {
  id: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  affiliate: {
    user: {
      name: string
      email: string
    }
    paypalEmail?: string
    bankName?: string
    accountNumber?: string
    accountName?: string
    routingNumber?: string
    country?: string
    swiftCode?: string
  }
}

interface PaymentDetails {
  type: string
  recipient?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  routingNumber?: string
  country?: string
}

interface PaymentProcessStepsProps {
  payment: Payment
  paymentDetails: PaymentDetails | null
}

export function PaymentProcessSteps({
  payment,
  paymentDetails,
}: PaymentProcessStepsProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [notes, setNotes] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const markAsProcessing = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/affiliate/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentId: payment.id,
          status: "PROCESSING"
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update payment status")
      }

      toast.success("Payment marked as processing")
      setStep(2)
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsPaid = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/affiliate/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentId: payment.id,
          status: "PAID",
          transactionId: transactionId || undefined,
          note: notes || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update payment status")
      }

      toast.success("Payment marked as paid successfully")
      setStep(3)
      setTimeout(() => {
        router.push("/admin/affiliate/payments")
      }, 2000)
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const rejectPayment = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/affiliate/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentId: payment.id,
          status: "REJECTED",
          note: notes || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to reject payment")
      }

      toast.success("Payment request rejected")
      setShowRejectDialog(false)
      router.push("/admin/affiliate/payments")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Process Payment Request</CardTitle>
          <CardDescription>
            Follow these steps to process the payment request for ${payment.amount.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Steps value={step} className="mt-4">
            <Step value={1} title="Review Details">
              <div className="mt-4 space-y-4">
                <div className="bg-muted rounded-md p-4">
                  <h3 className="font-medium mb-2">Payment Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Amount:</dt>
                      <dd className="font-medium">${payment.amount.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Method:</dt>
                      <dd className="font-medium">{payment.paymentMethod}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Affiliate:</dt>
                      <dd className="font-medium">{payment.affiliate.user.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email:</dt>
                      <dd className="font-medium">{payment.affiliate.user.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Request Date:</dt>
                      <dd className="font-medium">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                {paymentDetails && (
                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{paymentDetails.type} Details</h3>
                      {paymentDetails.type === "PayPal" && paymentDetails.recipient && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(paymentDetails.recipient!)}
                          className="h-8 gap-1"
                        >
                          <ClipboardCopy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                      )}
                    </div>
                    {paymentDetails.type === "PayPal" && (
                      <div className="font-mono text-sm p-2 bg-background rounded border">
                        {paymentDetails.recipient}
                      </div>
                    )}
                    {paymentDetails.type === "Bank Transfer" && (
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Bank:</dt>
                          <dd className="font-medium">{paymentDetails.bankName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Account Name:</dt>
                          <dd className="font-medium">{paymentDetails.accountName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Account Number:</dt>
                          <dd className="font-medium">{paymentDetails.accountNumber}</dd>
                        </div>
                        {paymentDetails.routingNumber && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Routing Number:</dt>
                            <dd className="font-medium">{paymentDetails.routingNumber}</dd>
                          </div>
                        )}
                        {paymentDetails.country && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Country:</dt>
                            <dd className="font-medium">{paymentDetails.country}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={markAsProcessing}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Continue to Payment"}
                    </Button>
                  </div>
                </div>
              </div>
            </Step>

            <Step value={2} title="Make Payment">
              <div className="mt-4 space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                  <div className="flex gap-2 text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Payment Instructions</p>
                      <p className="text-sm mt-1">
                        Please make the payment using the details above, then mark as paid once complete.
                        Ensure you enter the transaction reference for tracking purposes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction Reference (Optional)</Label>
                    <Input
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter payment reference or transaction ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this payment"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={markAsPaid}
                      disabled={isLoading}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      {isLoading ? "Processing..." : "Mark as Paid"}
                    </Button>
                  </div>
                </div>
              </div>
            </Step>

            <Step value={3} title="Completed">
              <div className="mt-4 space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-6 rounded-md text-center">
                  <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-medium mb-2">Payment Completed</h3>
                  <p className="text-green-700 dark:text-green-300">
                    The payment has been successfully marked as paid.
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    You'll be redirected to the payments page shortly.
                  </p>
                </div>

                <div className="flex justify-center pt-4">
                  <Button onClick={() => router.push("/admin/affiliate/payments")}>
                    Return to Payments
                  </Button>
                </div>
              </div>
            </Step>
          </Steps>
        </CardContent>
      </Card>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Rejecting this payment request will return ${payment.amount.toFixed(2)} to the affiliate's pending balance.
              <div className="mt-4 space-y-2">
                <Label htmlFor="rejection-notes">Rejection Notes (Optional)</Label>
                <Textarea
                  id="rejection-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide a reason for rejection"
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={rejectPayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Rejecting..." : "Reject Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}