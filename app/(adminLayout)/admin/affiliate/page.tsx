import { prisma } from "@/app/utils/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistance } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, DollarSign } from "lucide-react"

export const metadata = {
  title: "Affiliate Management | Admin Dashboard",
  description: "Manage affiliate programs and users",
}

async function getAffiliateStats() {
  const [
    totalEarnings,
    totalConversions,
    totalClicks,
    affiliateCount,
    topAffiliates,
    recentConversions,
  ] = await Promise.all([
    prisma.affiliate.aggregate({
      _sum: {
        totalEarnings: true,
      },
    }),
    prisma.affiliate.aggregate({
      _sum: {
        conversionCount: true,
      },
    }),
    prisma.affiliate.aggregate({
      _sum: {
        clickCount: true,
      },
    }),
    prisma.affiliate.count(),
    prisma.affiliate.findMany({
      take: 5,
      orderBy: {
        totalEarnings: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.affiliateReferral.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ])

  return {
    totalEarnings: totalEarnings._sum.totalEarnings || 0,
    totalConversions: totalConversions._sum.conversionCount || 0,
    totalClicks: totalClicks._sum.clickCount || 0,
    affiliateCount,
    topAffiliates,
    recentConversions,
  }
}

export default async function AffiliateManagement() {
  const stats = await getAffiliateStats()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Affiliate Management</h1>
          <p className="text-muted-foreground">
            Manage your affiliate program and monitor performance
          </p>
        </div>
        <Link href="/admin/affiliate/payments">
          <Button>
            <DollarSign className="mr-2 h-4 w-4" />
            Manage Payments
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalEarnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.affiliateCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="topAffiliates" className="w-full">
        <TabsList>
          <TabsTrigger value="topAffiliates">Top Affiliates</TabsTrigger>
          <TabsTrigger value="recentConversions">Recent Conversions</TabsTrigger>
        </TabsList>
        <TabsContent value="topAffiliates">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Affiliates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left font-medium">Affiliate</th>
                      <th className="py-3 text-left font-medium">
                        Commission Rate
                      </th>
                      <th className="py-3 text-left font-medium">
                        Total Earnings
                      </th>
                      <th className="py-3 text-left font-medium">Conversions</th>
                      <th className="py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">
                              {affiliate.user.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {affiliate.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          {(affiliate.commissionRate * 100).toFixed(0)}%
                        </td>
                        <td className="py-3">${affiliate.totalEarnings.toFixed(2)}</td>
                        <td className="py-3">{affiliate.conversionCount}</td>
                        <td className="py-3">
                          <Link
                            href={`/admin/affiliate/${affiliate.id}`}
                            className="text-primary hover:underline inline-flex items-center"
                          >
                            View Details
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recentConversions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left font-medium">Date</th>
                      <th className="py-3 text-left font-medium">Affiliate</th>
                      <th className="py-3 text-left font-medium">
                        Referred User
                      </th>
                      <th className="py-3 text-left font-medium">Amount</th>
                      <th className="py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentConversions.map((conversion) => (
                      <tr key={conversion.id} className="border-b">
                        <td className="py-3">
                          {formatDistance(
                            new Date(conversion.createdAt),
                            new Date(),
                            { addSuffix: true }
                          )}
                        </td>
                        <td className="py-3">
                          <div>
                            <div className="font-medium">
                              {conversion.affiliate.user.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {conversion.affiliate.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <div className="font-medium">
                              {conversion.user.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {conversion.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          ${conversion.commissionAmount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              conversion.status === "CONVERTED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : conversion.status === "PAID"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                            }`}
                          >
                            {conversion.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}