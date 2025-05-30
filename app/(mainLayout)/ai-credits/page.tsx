

import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Sparkles, CheckCircle2 } from "lucide-react"
import { getUserCreditBalance } from "@/app/actions/aiCredits"
import { CREDIT_PACKAGES } from "@/app/utils/credits"
import { use } from "react"
import CreditPurchaseButton from "@/components/CreditPurchaseButton"
import { Button } from "@/components/ui/button"
import { purchaseAICredits } from "@/app/api/ai-credits/purchase/route"


export default function AICreditsPage() {
  const session = use(auth())
  
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  const creditsBalance = use(
    getUserCreditBalance().catch(error => {
      console.error("Failed to get credit balance:", error);
      return 0;
    })
  )

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Coins className="h-8 w-8 text-primary" />
          AI Credits
        </h1>
        <p className="text-muted-foreground">
          Purchase credits to access premium AI-powered features
        </p>
      </div>
      
      <div className="mb-8 p-4 bg-primary/10 rounded-lg">
        <div className="flex gap-2 items-center">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Your Current Balance</h2>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-4xl font-bold">{creditsBalance}</span>
          <span className="text-muted-foreground mb-1">credits</span>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Choose a Package</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => (
            <Card key={id} className={id === "premium" ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>
                  {pkg.credits} AI credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  ${(pkg.price / 100).toFixed(2)}
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Resume enhancement ({Math.floor(pkg.credits / 15)} uses)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Job matching ({Math.floor(pkg.credits / 10)} uses)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Job description enhancement ({Math.floor(pkg.credits / 20)} uses)</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
              {/* <CardFooter>
                  <CreditPurchaseButton packageId={id} variant={id === "premium" ? "default" : "outline"} />
                </CardFooter> */}
                <form action={purchaseAICredits.bind(null, id)}>
                  <Button type="submit" className="w-full" variant={id === "premium" ? "default" : "outline"}>
                    Purchase
                  </Button>
                </form>


              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="mt-12 bg-muted/50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">About AI Credits</h3>
        <div className="space-y-4 text-muted-foreground">
          <p>
            AI credits are used to access premium AI-powered features in Domijob. Different features require different amounts of credits:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>AI Job Matcher: 10 credits per use</li>
            <li>Resume Enhancer: 15 credits per use</li>
            <li>Job Description Enhancer: 20 credits per use</li>
          </ul>
          <p>
            Credits do not expire and will remain in your account until used. For any questions about AI credits, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
} 