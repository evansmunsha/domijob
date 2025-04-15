"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AffiliateRegistration() {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [affiliateCode, setAffiliateCode] = useState("")

  const handleRegister = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to register as affiliate")
      }
      
      setAffiliateCode(data.affiliateCode)
      setRegistered(true)
      toast.success("Successfully registered as an affiliate!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register")
    } finally {
      setLoading(false)
    }
  }

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}/?ref=${affiliateCode}`
    navigator.clipboard.writeText(link)
    toast.success("Affiliate link copied to clipboard!")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Become an Affiliate</CardTitle>
        <CardDescription>
          Earn commissions by referring new users to our platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registered ? (
          <div className="space-y-4">
            <p className="text-sm">
              Congratulations! You are now an affiliate. Your unique affiliate code is:
            </p>
            <div className="p-3 bg-muted rounded text-center font-mono">
              {affiliateCode}
            </div>
            <p className="text-sm">
              Share your affiliate link to start earning commissions.
            </p>
            <Button 
              onClick={copyAffiliateLink} 
              className="w-full"
            >
              Copy Affiliate Link
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/affiliate"}
              className="w-full"
            >
              Go to Affiliate Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Join our affiliate program and earn commissions for every new user you refer who signs up and completes the required actions.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>10% commission on every successful referral</li>
              <li>Unique tracking links for all your marketing channels</li>
              <li>Detailed analytics dashboard</li>
              <li>Regular payouts</li>
            </ul>
          </div>
        )}
      </CardContent>
      {!registered && (
        <CardFooter>
          <Button 
            onClick={handleRegister} 
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Registering..." : "Register as Affiliate"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 