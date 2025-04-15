"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Share2, DollarSign, Users, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface AffiliateStats {
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  totalReferrals: number
  activeReferrals: number
  conversionRate: number
}

interface Referral {
  id: string
  referredUser: {
    email: string
  }
  status: string
  commissionAmount: number
  createdAt: string
  convertedAt?: string
}

export function AffiliateDashboard() {
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [affiliateCode, setAffiliateCode] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/affiliate/stats")
        if (!response.ok) throw new Error("Failed to fetch data")
        const data = await response.json()
        setStats(data.stats)
        setReferrals(data.referrals)
        setAffiliateCode(data.affiliateCode)
        setError(null)
      } catch (err) {
        setError("Failed to load affiliate data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}/register?ref=${affiliateCode}`
    navigator.clipboard.writeText(link)
    toast.success("Affiliate link copied to clipboard!")
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReferrals}</div>
            <p className="text-xs text-muted-foreground">Current referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Successful conversions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-2 border rounded-md bg-muted">
              {`${window.location.origin}/register?ref=${affiliateCode}`}
            </div>
            <Button onClick={copyAffiliateLink} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="referrals" className="w-full">
        <TabsList>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{referral.referredUser.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${referral.commissionAmount.toFixed(2)}</p>
                      <p className={`text-sm ${
                        referral.status === "CONVERTED" ? "text-green-500" :
                        referral.status === "PENDING" ? "text-yellow-500" :
                        "text-red-500"
                      }`}>
                        {referral.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Pending Earnings</p>
                  <p className="text-2xl font-bold">${stats.pendingEarnings.toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Paid Earnings</p>
                  <p className="text-2xl font-bold">${stats.paidEarnings.toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Minimum Payout Threshold</p>
                  <p className="text-sm text-muted-foreground">$50.00</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Payment Method</p>
                  <p className="text-sm text-muted-foreground">Add your payment method to receive payouts</p>
                  <Button className="mt-2">Add Payment Method</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 