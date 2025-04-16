import { Metadata } from "next"
import { AffiliateDashboard } from "@/components/affiliate/AffiliateDashboard"

export const metadata: Metadata = {
  title: "Affiliate Program | DoMiJob",
  description: "Earn commissions by referring new users to our platform",
}

export default function AffiliatePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Affiliate Program</h1>
      <p className="text-muted-foreground mb-8">
        Earn money by referring new users to our platform. Get paid for every successful referral!
      </p>
      
      <AffiliateDashboard />
    </div>
  )
} 