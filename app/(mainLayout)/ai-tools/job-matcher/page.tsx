import { Metadata } from "next"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { AIJobMatcher } from "@/components/jobs/AIJobMatcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getUserCreditBalance } from "@/app/actions/aiCredits"
import { use } from "react"
import { CREDIT_COSTS } from "@/app/utils/credits"

export const metadata: Metadata = {
  title: "AI Job Matcher",
  description: "Find the perfect jobs that match your skills and experience using AI",
}

export default function AIJobMatcherPage() {
  const session = use(auth())
  
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  const creditsBalance = use(getUserCreditBalance())
  const costPerUse = CREDIT_COSTS.job_match

  const hasEnoughCredits = creditsBalance >= costPerUse

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/ai-tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Tools
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Job Matcher
            </h1>
            <p className="text-muted-foreground">
              Find the perfect jobs that match your skills and experience
            </p>
          </div>
          
          <Card className="w-auto">
            <CardContent className="p-4 flex items-center gap-3">
              <div>
                <p className="text-sm font-medium">Credits Balance</p>
                <p className={`text-xl font-bold ${!hasEnoughCredits ? 'text-destructive' : ''}`}>
                  {creditsBalance}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Cost per Use</p>
                <p className="text-xl font-bold">{costPerUse}</p>
              </div>
              
              {!hasEnoughCredits && (
                <Button asChild size="sm" className="ml-2">
                  <Link href="/ai-credits">
                    Buy Credits
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {!hasEnoughCredits ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Insufficient Credits</CardTitle>
            <CardDescription>
              You need at least {costPerUse} credits to use this feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Purchase more credits to use the AI Job Matcher and find the best jobs that match your skills and experience.
            </p>
            <Button asChild>
              <Link href="/ai-credits">
                Purchase Credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AIJobMatcher />
      )}
    </div>
  )
} 