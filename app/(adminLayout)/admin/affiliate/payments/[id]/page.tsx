import { prisma } from "@/app/utils/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { notFound } from "next/navigation"
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge"
import { PaymentActionButtons } from "@/components/admin/PaymentActionButtons"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TransactionIdForm } from "@/components/admin/TransactionIdForm"

export const metadata = {
  title: "Payment Details | Admin Dashboard",
  description: "View and manage affiliate payment details",
}

export default async function PaymentDetails({
  params,
}: {
  params: { id: string },
}) {
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
      accountType: "Email",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/affiliate/payments" className="hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold">Payment Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="font-medium">Payment ID</dt>
                <dd className="text-muted-foreground">{payment.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Amount</dt>
                <dd className="text-xl font-bold">
                  ${payment.amount.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Status</dt>
                <dd><PaymentStatusBadge status={payment.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Requested Date</dt>
                <dd>{format(new Date(payment.createdAt), "PPP")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Payment Method</dt>
                <dd>{payment.paymentMethod}</dd>
              </div>
              {payment.paidAt && (
                <div className="flex justify-between">
                  <dt className="font-medium">Payment Date</dt>
                  <dd>{format(new Date(payment.paidAt), "PPP")}</dd>
                </div>
              )}
              {payment.transactionId && (
                <div className="flex justify-between">
                  <dt className="font-medium">Transaction ID</dt>
                  <dd className="font-mono">{payment.transactionId}</dd>
                </div>
              )}
            </dl>

            {payment.status === "PENDING" && (
              <div className="mt-6">
                <PaymentActionButtons paymentId={payment.id} />
              </div>
            )}

            {payment.status === "PROCESSING" && (
              <div className="mt-6">
                <TransactionIdForm paymentId={payment.id} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affiliate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="font-medium">Name</dt>
                <dd className="text-lg">{payment.affiliate.user.name}</dd>
              </div>
              <div>
                <dt className="font-medium">Email</dt>
                <dd>{payment.affiliate.user.email}</dd>
              </div>
              <div>
                <dt className="font-medium">Affiliate Code</dt>
                <dd className="font-mono">{payment.affiliate.code}</dd>
              </div>
              <div>
                <dt className="font-medium">Commission Rate</dt>
                <dd>{(payment.affiliate.commissionRate * 100).toFixed(0)}%</dd>
              </div>
              <div>
                <dt className="font-medium">Total Earnings</dt>
                <dd>${payment.affiliate.totalEarnings.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="font-medium">Conversions</dt>
                <dd>{payment.affiliate.conversionCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {paymentDetails && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Payment Method Details</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentDetails.type === "PayPal" ? (
                <dl className="space-y-4">
                  <div>
                    <dt className="font-medium">Payment Type</dt>
                    <dd>PayPal</dd>
                  </div>
                  <div>
                    <dt className="font-medium">PayPal Email</dt>
                    <dd>{paymentDetails.recipient}</dd>
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      To complete this payment, send the amount to the PayPal email
                      address above. Once payment is complete, update the status
                      and add the transaction ID.
                    </p>
                  </div>
                </dl>
              ) : (
                <dl className="space-y-4">
                  <div>
                    <dt className="font-medium">Payment Type</dt>
                    <dd>Bank Transfer</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Bank Name</dt>
                    <dd>{paymentDetails.bankName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Account Holder</dt>
                    <dd>{paymentDetails.accountName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Account Number</dt>
                    <dd className="font-mono">{paymentDetails.accountNumber}</dd>
                  </div>
                  {paymentDetails.routingNumber && (
                    <div>
                      <dt className="font-medium">Routing Number</dt>
                      <dd className="font-mono">{paymentDetails.routingNumber}</dd>
                    </div>
                  )}
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      To complete this payment, transfer the amount to the bank
                      account above. Once payment is complete, update the status
                      and add the transaction ID.
                    </p>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}