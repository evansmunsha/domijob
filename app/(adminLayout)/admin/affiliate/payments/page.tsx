import { prisma } from "@/app/utils/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AffiliatePaymentTable } from "@/components/admin/AffiliatePaymentTable"
import { PaymentFilterForm } from "@/components/admin/PaymentFilterForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { revalidatePath } from "next/cache"

export const metadata = {
  title: "Affiliate Payments | Admin Dashboard",
  description: "Manage affiliate payment requests and transactions",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

// Define a function to map database payment to the expected type
const mapPaymentToTableFormat = (payment: any) => {
  return {
    id: payment.id,
    amount: payment.amount,
    status: payment.status as "PENDING" | "PROCESSING" | "PAID" | "REJECTED",
    paymentMethod: payment.paymentMethod,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    transactionId: payment.transactionId,
    affiliate: {
      id: payment.affiliate.id,
      user: {
        id: payment.affiliate.user.id,
        name: payment.affiliate.user.name || "Unknown User",
        email: payment.affiliate.user.email,
        image: payment.affiliate.user.image
      },
      code: payment.affiliate.code,
      paymentMethod: payment.affiliate.paymentMethod,
      paypalEmail: payment.affiliate.paypalEmail,
      bankName: payment.affiliate.bankName,
      accountNumber: payment.affiliate.accountNumber,
      accountName: payment.affiliate.accountName
    }
  }
}

export default async function AffiliatePayments({ 
  searchParams 
}: { 
  searchParams: { status?: string; startDate?: string; endDate?: string } 
}) {
  const status = searchParams.status || "ALL"
  const startDate = searchParams.startDate
  const endDate = searchParams.endDate
  
  // Create where object conditionally to avoid using delete
  const where: any = {}
  
  if (status !== "ALL") {
    where.status = status
  }
  
  // Only add createdAt if date filters are present
  if (startDate || endDate) {
    where.createdAt = {}
    
    if (startDate) {
      where.createdAt.gte = new Date(startDate)
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate)
      endDateObj.setHours(23, 59, 59, 999)
      where.createdAt.lte = endDateObj
    }
  }

  // Get stats
  const [
    pendingPaymentsDb,
    pendingPaymentsTotal, 
    processingPaymentsTotal,
    paidPaymentsTotal,
    rejectedPaymentsTotal
  ] = await Promise.all([
    prisma.affiliatePayment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    }),
    prisma.affiliatePayment.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.affiliatePayment.aggregate({
      where: { status: "PROCESSING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.affiliatePayment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.affiliatePayment.aggregate({
      where: { status: "REJECTED" },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  // Get filtered payments
  const paymentsDb = await prisma.affiliatePayment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })

  // Map the database results to the expected format
  const pendingPayments = pendingPaymentsDb.map(mapPaymentToTableFormat)
  const payments = paymentsDb.map(mapPaymentToTableFormat)

  const handleProcessed = async () => {
    "use server"
    revalidatePath("/admin/affiliate/payments")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Affiliate Payments</h1>
        <p className="text-muted-foreground">
          Process and manage affiliate payment requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingPaymentsTotal._sum.amount?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {pendingPaymentsTotal._count} pending requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Processing Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${processingPaymentsTotal._sum.amount?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {processingPaymentsTotal._count} processing
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
            <div className="text-xs text-muted-foreground mt-1">
              {paidPaymentsTotal._count} completed payments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Rejected Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${rejectedPaymentsTotal._sum.amount?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {rejectedPaymentsTotal._count} rejected requests
            </div>
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
          
          <Tabs defaultValue={status === "ALL" ? "pending" : status.toLowerCase()} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-6">
              <AffiliatePaymentTable 
                payments={pendingPayments.length > 0 ? pendingPayments : payments.filter(p => p.status === "PENDING")} 
                onProcessed={handleProcessed}
              />
            </TabsContent>
            
            <TabsContent value="processing" className="mt-6">
              <AffiliatePaymentTable 
                payments={payments.filter(p => p.status === "PROCESSING")} 
                onProcessed={handleProcessed}
              />
            </TabsContent>
            
            <TabsContent value="paid" className="mt-6">
              <AffiliatePaymentTable 
                payments={payments.filter(p => p.status === "PAID")} 
                onProcessed={handleProcessed}
              />
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-6">
              <AffiliatePaymentTable 
                payments={payments.filter(p => p.status === "REJECTED")} 
                onProcessed={handleProcessed}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}