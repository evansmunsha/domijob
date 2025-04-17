 "use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

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
  }
}

interface PaymentProcessStepsProps {
  payment: Payment
  paymentDetails: any
}

export function PaymentProcessSteps({
  payment,
  paymentDetails,
}: PaymentProcessStepsProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(payment.status === "PROCESSING" ? 2 : 1)
  const [isLoading, setIsLoading] = useState(false)
  const [transactionId, setTransactionId] = useState("")

  const markAsProcessing = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/affiliate/payments/${payment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PROCESSING",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update payment status")
      }

      toast.success("Payment marked as processing")
      setCurrentStep(2)
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsPaid = async () => {
    if (!transactionId.trim()) {
      toast.error("Transaction ID is required")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/affiliate/payments/${payment.id}`, {
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
      setCurrentStep(4)
    } catch (error) {
      console.error("Error completing payment:", error)
      toast.error(`Failed to complete payment: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card className={currentStep >= 1 ? "border-primary" : ""}>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Step 1</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2 pt-0">
            <p className="text-xs">Review Payment</p>
          </CardContent>
          {currentStep >= 1 && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          )}
        </Card>
        <Card className={currentStep >= 2 ? "border-primary" : ""}>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Step 2</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2 pt-0">
            <p className="text-xs">Process Payment</p>
          </CardContent>
          {currentStep >= 2 && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          )}
        </Card>
        <Card className={currentStep >= 3 ? "border-primary" : ""}>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Step 3</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2 pt-0">
            <p className="text-xs">Enter Transaction ID</p>
          </CardContent>
          {currentStep >= 3 && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          )}
        </Card>
        <Card className={currentStep >= 4 ? "border-primary" : ""}>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Step 4</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2 pt-0">
            <p className="text-xs">Complete</p>
          </CardContent>
          {currentStep >= 4 && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          )}
        </Card>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Amount:</strong> ${payment.amount.toFixed(2)}
              </div>
              <div>
                <strong>Affiliate:</strong> {payment.affiliate.user.name} ({payment.affiliate.user.email})
              </div>
              <div>
                <strong>Payment Method:</strong> {payment.paymentMethod}
              </div>
              {paymentDetails && (
                <div className="border p-4 rounded-md bg-muted/20">
                  <h3 className="font-semibold mb-2">Payment Information</h3>
                  {paymentDetails.type === "PayPal" ? (
                    <div>
                      <p>
                        <strong>PayPal Email:</strong> {paymentDetails.recipient}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>
                        <strong>Bank:</strong> {paymentDetails.bankName}
                      </p>
                      <p>
                        <strong>Account Name:</strong> {paymentDetails.accountName}
                      </p>
                      <p>
                        <strong>Account Number:</strong> {paymentDetails.accountNumber}
                      </p>
                      {paymentDetails.routingNumber && (
                        <p>
                          <strong>Routing Number:</strong> {paymentDetails.routingNumber}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={markAsProcessing} disabled={isLoading}>
              {isLoading ? "Processing..." : "Start Processing"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Process Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border p-4 rounded-md bg-muted/20">
                <h3 className="font-semibold mb-2">Instructions</h3>
                {paymentDetails?.type === "PayPal" ? (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Log in to your PayPal business account</li>
                    <li>Click on "Send & Request"</li>
                    <li>
                      Send ${payment.amount.toFixed(2)} to{" "}
                      <span className="font-mono">{paymentDetails.recipient}</span>
                    </li>
                    <li>Include the payment ID in the note: {payment.id}</li>
                    <li>Complete the payment</li>
                    <li>Copy the transaction ID from PayPal</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Log in to your banking portal</li>
                    <li>Navigate to the transfer or wire transfer section</li>
                    <li>
                      Enter the bank details:
                      <ul className="list-disc list-inside ml-5 mt-1">
                        <li>Bank: {paymentDetails?.bankName}</li>
                        <li>Account name: {paymentDetails?.accountName}</li>
                        <li>Account number: {paymentDetails?.accountNumber}</li>
                        {paymentDetails?.routingNumber && (
                          <li>Routing number: {paymentDetails.routingNumber}</li>
                        )}
                      </ul>
                    </li>
                    <li>Enter the amount: ${payment.amount.toFixed(2)}</li>
                    <li>
                      Include the payment ID as a reference: {payment.id}
                    </li>
                    <li>Complete the transfer</li>
                    <li>Copy the transaction or reference ID</li>
                  </ol>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setCurrentStep(3)}>
              Continue to Next Step
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Transaction ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  placeholder="Enter payment transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the transaction ID or reference number from your payment platform.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={markAsPaid} disabled={isLoading || !transactionId.trim()}>
              {isLoading ? "Processing..." : "Mark as Paid"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-6">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
              <p className="text-muted-foreground mb-4">
                The payment has been successfully processed and marked as paid.
              </p>
              <Button onClick={() => router.push("/admin/affiliate/payments")}>
                Return to Payments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}