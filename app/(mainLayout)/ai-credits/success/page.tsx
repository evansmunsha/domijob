import { Metadata } from "next"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getUserCreditBalance } from "@/app/actions/aiCredits"
import { use } from "react"

export const metadata: Metadata = {
  title: "Purchase Successful",
  description: "Your AI credits have been added to your account"
}

export default function AICreditsSuccessPage() {
  const session = use(auth())
  
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  const creditsBalance = use(getUserCreditBalance())

  return (
    <div className="container py-10 max-w-md">
      <Card className="border-2 border-primary/50">
        <CardHeader className="pb-2 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Purchase Successful!</h1>
          <p className="text-muted-foreground">
            Your AI credits have been added to your account
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="my-6">
            <div className="text-sm font-medium text-muted-foreground">Your Current Balance</div>
            <div className="text-4xl font-bold mt-1">{creditsBalance} credits</div>
          </div>
          <p className="text-sm text-muted-foreground">
            You can now use these credits to access premium AI features like resume enhancement, job matching, and more.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/ai-tools">
              Explore AI Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/ai-credits">
              Buy More Credits
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 