"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ReferralList } from "./ReferralList"
import { PaymentHistory } from "./PaymentHistory"
import { ClickAnalytics } from "./ClickAnalytics"
import { AffiliateLink } from "./AffiliateLink"
import { PaymentRequest } from "./PaymentRequest"
import { MarketingMaterials } from "./MarketingMaterials"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import Link from "next/link"
import { ScrollableTabsList } from "./ScrollableTabsList"

interface AffiliateStats {
  code: string
  commissionRate: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  conversionCount: number
  clickCount: number
  paymentMethod?: string
  paypalEmail?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  routingNumber?: string
  referrals: Array<{
    id: string
    createdAt: string
    status: string
    commissionAmount: number
    referredUserId: string
  }>
  clicks: Array<{
    id: string
    timestamp: string
    source: string
    converted: boolean
  }>
}

export function AffiliateDashboard() {
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const registerAsAffiliate = async () => {
    try {
      setRegistering(true)
      const response = await fetch("/api/affiliate/register", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to register")
      }

      // Registration successful, fetch stats again
      fetchStats()
    } catch (err) {
      setError(`Registration failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setRegistering(false)
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/affiliate/stats")

      if (!response.ok) {
        const data = await response.json()
        // Handle different error cases
        if (response.status === 401) {
          setError("unauthorized")
          return
        }
        if (response.status === 404) {
          // Not registered yet - show registration option
          setStats(null)
          setError("not_registered")
          return
        }
        throw new Error(data.error || "Failed to fetch stats")
      }

      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.message.includes("Affiliate not found")) {
        setError("not_registered")
      } else {
        setError("Failed to load affiliate stats")
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    fetchStats()
  }, [refreshKey])

  if (loading) return <div>Loading...</div>

  // Show login prompt
  if (error === "unauthorized") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>You need to be logged in to access the affiliate dashboard.</p>
          <a
            href="/login"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded inline-block"
          >
            Sign In
          </a>
        </CardContent>
      </Card>
    )
  }

  // Show registration option
  if (error === "not_registered") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Join Our Affiliate Program</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Earn money by referring new users to our platform!</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Get commission for every successful referral</li>
            <li>Track your earnings and performance</li>
            <li>Request payouts for your earnings</li>
          </ul>
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
            onClick={registerAsAffiliate}
            disabled={registering}
          >
            {registering ? "Registering..." : "Register as Affiliate"}
          </button>
        </CardContent>
      </Card>
    )
  }

  if (error && error !== "not_registered") return <div>Error: {error}</div>
  if (!stats) return null

  // Define tabs for the ScrollableTabsList component
  const tabs = [
    { value: "link", label: "Your Link" },
    { value: "referrals", label: "Referrals" },
    { value: "analytics", label: "Analytics" },
    { value: "payments", label: "Payments" },
    { value: "request", label: "Request Payout" },
    { value: "marketing", label: "Marketing Materials" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/affiliate/faq" className="flex items-center gap-2">
            <HelpCircle size={16} />
            <span>FAQ</span>
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clickCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="link">
        <ScrollableTabsList tabs={tabs} />

        <TabsContent value="link">
          <AffiliateLink code={stats.code} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralList referrals={stats.referrals} />
        </TabsContent>

        <TabsContent value="analytics">
          <ClickAnalytics clicks={stats.clicks} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentHistory />
        </TabsContent>

        <TabsContent value="request">
          <PaymentRequest pendingAmount={stats.pendingEarnings} onSuccess={refreshData} />
        </TabsContent>

        <TabsContent value="marketing">
          <MarketingMaterials affiliateCode={stats.code} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
