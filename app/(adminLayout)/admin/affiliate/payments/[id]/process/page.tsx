import { prisma } from "@/app/utils/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { PaymentProcessSteps } from "@/components/admin/PaymentProcessSteps"

export const metadata = {
  title: "Process Payment | Admin Dashboard",
  description: "Process affiliate payment requests",
}

// @ts-ignore - Next.js 15 PageProps compatibility issue
export default async function ProcessPayment({ params }: { params: { id: string } }) {
  const payment = await prisma.affiliatePayment.findUnique({
    where: { id: params.id },
    include: {
      affiliate: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!payment) {
    notFound()
  }

  // Get payment method details
  let paymentDetails = null
  if (payment.paymentMethod === "PAYPAL" && payment.affiliate.paypalEmail) {
    paymentDetails = {
      type: "PayPal",
      recipient: payment.affiliate.paypalEmail,
    }
  } else if (payment.paymentMethod === "BANK" && payment.affiliate.bankName) {
    paymentDetails = {
      type: "Bank Transfer",
      bankName: payment.affiliate.bankName,
      accountName: payment.affiliate.accountName,
      accountNumber: payment.affiliate.accountNumber,
      routingNumber: payment.affiliate.routingNumber,
    }
  }

  // Check if payment can be processed
  const canProcess = payment.status === "PENDING" || payment.status === "PROCESSING"
  
  // Create a properly formatted payment object that matches the expected interface
  const formattedPayment = {
    id: payment.id,
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    createdAt: payment.createdAt.toISOString(),
    affiliate: {
      user: {
        name: payment.affiliate.user.name || "Unknown User",
        email: payment.affiliate.user.email
      },
      paypalEmail: payment.affiliate.paypalEmail || undefined,
      bankName: payment.affiliate.bankName || undefined,
      accountNumber: payment.affiliate.accountNumber || undefined,
      accountName: payment.affiliate.accountName || undefined,
      routingNumber: payment.affiliate.routingNumber || undefined
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/affiliate/payments/${payment.id}`}
          className="hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold">Process Payment</h1>
      </div>

      {!canProcess ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              {payment.status === "PAID" ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">
                    Payment Already Processed
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    This payment has already been marked as paid on{" "}
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString()
                      : "an unknown date"}
                    .
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">
                    Payment Cannot Be Processed
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    This payment has been rejected and cannot be processed.
                  </p>
                </>
              )}
              <Link
                href="/admin/affiliate/payments"
                className="text-primary hover:underline"
              >
                Return to payment list
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PaymentProcessSteps
          payment={formattedPayment}
          paymentDetails={paymentDetails}
        />
      )}
    </div>
  )
}