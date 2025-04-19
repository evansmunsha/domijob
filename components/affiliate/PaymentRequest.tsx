"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, AlertCircle, DollarSign, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PaymentRequestProps {
  pendingAmount: number
  onSuccess: () => void
  minPayout?: number
}

interface PaymentSettings {
  paymentMethod: string
  paypalEmail?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  routingNumber?: string
}

export function PaymentRequest({ pendingAmount, onSuccess, minPayout = 50 }: PaymentRequestProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    paymentMethod: "paypal",
    paypalEmail: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    routingNumber: ""
  })

  // Fetch existing payment settings on component mount
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch("/api/affiliate/payment-settings")
        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            setPaymentSettings(data.settings)
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment settings:", error)
      }
    }

    fetchPaymentSettings()
  }, [])

  const requestPayment = async () => {
    if (pendingAmount <= 0) {
      toast.error("You don't have any pending earnings to withdraw")
      return
    }

    // Check if payment method is set up
    if (paymentSettings.paymentMethod === "paypal" && !paymentSettings.paypalEmail) {
      toast.error("Please set up your PayPal email first")
      return
    }

    if (paymentSettings.paymentMethod === "bank" && 
        (!paymentSettings.bankName || !paymentSettings.accountNumber || !paymentSettings.accountName)) {
      toast.error("Please complete your bank account details first")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/affiliate/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: paymentSettings.paymentMethod
        }),
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

  const savePaymentSettings = async () => {
    try {
      setIsSavingSettings(true)
      
      const response = await fetch("/api/affiliate/payment-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentSettings),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save payment settings")
      }

      toast.success("Payment settings saved successfully!")
    } catch (error) {
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaymentSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePaymentMethodChange = (value: string) => {
    setPaymentSettings(prev => ({
      ...prev,
      paymentMethod: value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings & Requests</CardTitle>
        <CardDescription>Manage your payment methods and request payouts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-4">
          <h4 className="font-medium text-amber-800 dark:text-amber-400">Payment Guidelines</h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li>• Your balance must reach ${minPayout || 50} before you can request a withdrawal</li>
            <li>• Submit payment requests before 5PM UK time on Fridays for processing</li>
            <li>• Approved payments will be processed during the following week</li>
            <li>• Earnings have a 30-day holding period before becoming eligible for withdrawal</li>
          </ul>
        </div>
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request Payment</TabsTrigger>
            <TabsTrigger value="settings">Payment Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="request" className="space-y-4">
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
                    Payments are made via your selected payment method.
                    Ensure your payment details are up to date in the Payment Settings tab.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup 
                  value={paymentSettings.paymentMethod} 
                  onValueChange={handlePaymentMethodChange}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal">PayPal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank">Bank Transfer</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {paymentSettings.paymentMethod === "paypal" && (
                <div className="space-y-2">
                  <Label htmlFor="paypalEmail">PayPal Email</Label>
                  <Input
                    id="paypalEmail"
                    name="paypalEmail"
                    type="email"
                    placeholder="your-email@example.com"
                    value={paymentSettings.paypalEmail || ""}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              {paymentSettings.paymentMethod === "bank" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      placeholder="Enter bank name"
                      value={paymentSettings.bankName || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Holder Name</Label>
                    <Input
                      id="accountName"
                      name="accountName"
                      placeholder="Enter account holder name"
                      value={paymentSettings.accountName || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      placeholder="Enter account number"
                      value={paymentSettings.accountNumber || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      name="routingNumber"
                      placeholder="Enter routing number"
                      value={paymentSettings.routingNumber || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
              
              <Button
                onClick={savePaymentSettings}
                disabled={isSavingSettings}
                className="flex items-center gap-2 mt-4"
              >
                <Save className="h-4 w-4" />
                {isSavingSettings ? "Saving..." : "Save Payment Settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 