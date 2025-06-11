"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { Check, X, AlertTriangle } from "lucide-react"
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

type PaymentProcessFormProps = {
  payment: {
    id: string
    status: string
    amount: number
    paymentMethod: string
    transactionId: string | null
    affiliate: {
      user: {
        name: string
        email: string
      }
    }
  }
}

export function PaymentProcessForm({ payment }: PaymentProcessFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(payment.status)
  const [transactionId, setTransactionId] = useState(payment.transactionId || "")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  
  const handleStatusChange = async (newStatus: string) => {
    // If rejecting, confirm first
    if (newStatus === "REJECTED") {
      setStatus(newStatus)
      setShowRejectDialog(true)
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/affiliate/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentId: payment.id,
          status: newStatus,
          transactionId: newStatus === "PAID" ? transactionId : undefined
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update payment status")
      }
      
      toast.success(`Payment marked as ${newStatus.toLowerCase()}`)
      router.refresh()
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleReject = async () => {
    await handleStatusChange("REJECTED")
    setShowRejectDialog(false)
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Update Status</Label>
        <Select 
          value={status} 
          onValueChange={setStatus}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {status === "PAID" && (
        <div className="space-y-2">
          <Label htmlFor="transactionId">Transaction ID/Reference (Optional)</Label>
          <Input
            id="transactionId"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter transaction reference"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Add a transaction ID or reference number for this payment
          </p>
        </div>
      )}
      
      <div className="pt-4 flex justify-between">
        <Button 
          onClick={() => router.back()}
          variant="outline"
          disabled={isLoading}
        >
          Cancel
        </Button>
        
        <div className="flex space-x-2">
          {status === "PENDING" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("PROCESSING")}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              Mark as Processing
            </Button>
          )}
          
          {(status === "PENDING" || status === "PROCESSING") && (
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          )}
          
          {(status === "PENDING" || status === "PROCESSING") && (
            <Button
              onClick={() => handleStatusChange("PAID")}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isLoading ? "Processing..." : "Mark as Paid"}
            </Button>
          )}
          
          {(status === "PAID" || status === "REJECTED") && (
            <Button
              onClick={() => handleStatusChange(status)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Updating..." : "Update Payment"}
            </Button>
          )}
        </div>
      </div>
      
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Rejecting this payment request will return ${payment.amount.toFixed(2)} to the affiliate's pending balance.
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  Make sure to communicate with the affiliate about why their payment request was rejected.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
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