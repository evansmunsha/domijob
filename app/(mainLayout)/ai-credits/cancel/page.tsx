import { Metadata } from "next"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export const metadata: Metadata = {
  title: "Purchase Cancelled",
  description: "Your AI credits purchase was cancelled"
}

export default function AICreditsCancelPage() {
  const session = use(auth())
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="container py-10 max-w-md">
      <Card>
        <CardHeader className="pb-2 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Purchase Cancelled</h1>
          <p className="text-muted-foreground">
            Your credit purchase was not completed
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground my-4">
            No charges were made to your account. You can try again or explore our AI tools with your existing credits.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/ai-credits">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Credits Page
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/ai-tools">
              Explore AI Tools
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 