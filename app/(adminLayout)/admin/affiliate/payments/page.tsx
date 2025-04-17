import { prisma } from "@/app/utils/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import Link from "next/link"
import { PaymentStatusSelect } from "@/components/admin/PaymentStatusSelect"
import { PaymentFilterForm } from "@/components/admin/PaymentFilterForm"

export const metadata = {
  title: "Affiliate Payments | Admin Dashboard",
  description: "Manage affiliate payment requests and transactions",
}

export default async function AffiliatePayments({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string; startDate?: string; endDate?: string }> 
}) {
  const resolvedParams = await searchParams
  const status = resolvedParams.status || "PENDING"
  
  // Create where object conditionally to avoid using delete
  const where: any = {
    status: status === "ALL" ? undefined : status,
  }
  
  // Only add createdAt if date filters are present
  if (resolvedParams.startDate || resolvedParams.endDate) {
    where.createdAt = {}
    
    if (resolvedParams.startDate) {
      where.createdAt.gte = new Date(resolvedParams.startDate)
    }
    
    if (resolvedParams.endDate) {
      where.createdAt.lte = new Date(resolvedParams.endDate)
    }
  }

  const [payments, pendingPaymentsTotal, paidPaymentsTotal] = await Promise.all([
    prisma.affiliatePayment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
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
    }),
    prisma.affiliatePayment.aggregate({
      where: { status: "PENDING" },
      _sum: {
        amount: true,
      },
    }),
    prisma.affiliatePayment.aggregate({
      where: { status: "PAID" },
      _sum: {
        amount: true,
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Affiliate Payments</h1>
        <p className="text-muted-foreground">
          Process and manage affiliate payment requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingPaymentsTotal._sum.amount?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${paidPaymentsTotal._sum.amount?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <PaymentFilterForm />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Request Date</th>
                  <th className="py-3 text-left font-medium">Affiliate</th>
                  <th className="py-3 text-left font-medium">Amount</th>
                  <th className="py-3 text-left font-medium">Method</th>
                  <th className="py-3 text-left font-medium">Status</th>
                  <th className="py-3 text-left font-medium">Payout Details</th>
                  <th className="py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3">
                      {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3">
                      <div>
                        <div className="font-medium">
                          {payment.affiliate.user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.affiliate.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">${payment.amount.toFixed(2)}</td>
                    <td className="py-3">{payment.paymentMethod}</td>
                    <td className="py-3">
                      <PaymentStatusSelect
                        paymentId={payment.id}
                        initialStatus={payment.status}
                      />
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/admin/affiliate/payments/${payment.id}`}
                        className="text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/admin/affiliate/payments/${payment.id}/process`}
                        className="text-primary hover:underline"
                      >
                        Process Payment
                      </Link>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      No payment requests found with the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}