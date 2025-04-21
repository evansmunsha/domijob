import { Metadata } from "next"
import { AffiliateFAQ } from "@/components/affiliate/AffiliateFAQ"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Affiliate Program FAQ",
  description: "Frequently asked questions about our affiliate program"
}

export default async function AffiliateFAQPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/affiliate/faq")
  }
  
  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/affiliate">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Affiliate Program FAQ</h1>
          <p className="text-muted-foreground">
            Answers to common questions about our affiliate program
          </p>
        </div>
      </div>
      
      <div className="grid gap-6">
        <AffiliateFAQ />
        
        <div className="text-center py-6">
          <p className="mb-4 text-muted-foreground">
            Didn't find what you're looking for? Contact our affiliate support team.
          </p>
          <Button asChild>
            <Link href="mailto:munshastripe@gmail.com">Contact Affiliate Support</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 