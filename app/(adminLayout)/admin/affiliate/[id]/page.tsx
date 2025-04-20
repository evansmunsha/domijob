import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/app/utils/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AffiliateEditForm from "@/components/admin/AffiliateEditForm"
import PaymentHistoryTable from "@/components/admin/PaymentHistoryTable"
import AffiliatePaymentHistory from "@/components/admin/AffiliatePaymentHistory"
import { auth } from "@/app/utils/auth"
import { formatDistanceToNow } from "date-fns"

export default async function AffiliateDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }
  
  const affiliate = await prisma.affiliate.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: true,
      AffiliatePayment: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!affiliate) {
    notFound()
  }
  
  // Calculate performance metrics
  const totalEarnings = affiliate.totalEarnings || 0
  const pendingEarnings = affiliate.pendingEarnings || 0
  const paidEarnings = affiliate.paidEarnings || 0
  const totalConversions = affiliate.conversionCount || 0
  const totalClicks = affiliate.clickCount || 0
  
  // Calculate conversion rate
  const conversionRate = totalClicks > 0 
    ? ((totalConversions / totalClicks) * 100).toFixed(2) 
    : "0.00"

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Cast affiliate to the expected type for the form
  const affiliateForForm = {
    id: affiliate.id,
    userId: affiliate.userId,
    code: affiliate.code,
    commissionRate: affiliate.commissionRate,
    totalEarnings: affiliate.totalEarnings,
    pendingEarnings: affiliate.pendingEarnings,
    paidEarnings: affiliate.paidEarnings,
    conversionCount: affiliate.conversionCount,
    clickCount: affiliate.clickCount,
    paymentMethod: affiliate.paymentMethod,
    paypalEmail: affiliate.paypalEmail,
    bankName: affiliate.bankName,
    accountNumber: affiliate.accountNumber,
    accountName: affiliate.accountName,
    routingNumber: affiliate.routingNumber,
    swiftCode: affiliate.swiftCode,
    country: affiliate.country,
    createdAt: affiliate.createdAt,
    updatedAt: affiliate.updatedAt,
    user: {
      id: affiliate.user.id,
      name: affiliate.user.name,
      email: affiliate.user.email,
      image: affiliate.user.image
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Details</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Information</CardTitle>
            <CardDescription>Basic details about this affiliate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
              <div className="font-medium">{affiliate.user.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
              <div className="font-medium">{affiliate.user.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Affiliate Code</div>
              <div className="font-medium">{affiliate.code}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Commission Rate</div>
              <div className="font-medium">{affiliate.commissionRate * 100}%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Preferred Payment Method</div>
              <div className="font-medium">{affiliate.paymentMethod || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <Badge variant="default">
                Active
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Joined</div>
              <div className="font-medium">
                {formatDistanceToNow(new Date(affiliate.createdAt), { addSuffix: true })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Statistics for this affiliate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Total Earnings</div>
                <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Pending Earnings</div>
                <div className="text-2xl font-bold">{formatCurrency(pendingEarnings)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Paid Earnings</div>
                <div className="text-2xl font-bold">{formatCurrency(paidEarnings)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Conversions</div>
                <div className="text-2xl font-bold">{totalConversions}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Clicks</div>
                <div className="text-2xl font-bold">{totalClicks}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Conversion Rate</div>
                <div className="text-2xl font-bold">{conversionRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="edit">Edit Affiliate</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments" className="mt-6">
          <AffiliatePaymentHistory 
            payments={affiliate.AffiliatePayment} 
            affiliateId={affiliate.id} 
          />
        </TabsContent>
        
        <TabsContent value="edit" className="mt-6">
          <AffiliateEditForm affiliate={affiliateForForm} />
        </TabsContent>
      </Tabs>
    </div>
  )
}