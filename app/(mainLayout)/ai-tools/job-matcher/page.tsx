import { Metadata } from "next"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Loader2, AlertCircle, CheckCircle, Building, MapPin, Clock, DollarSign, ThumbsUp } from "lucide-react"
import { getUserCreditBalance } from "@/app/actions/aiCredits"
import { CREDIT_COSTS } from "@/app/utils/credits"
import { use } from "react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "AI Job Matcher",
  description: "Match your resume with available jobs using AI"
}

export default function JobMatcherPage() {
  const session = use(auth())
  
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  const creditsBalance = use(getUserCreditBalance())
  
  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Job Matcher
        </h1>
        <p className="text-muted-foreground">
          Let our AI analyze your resume and match you with the most suitable jobs
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Credits Required</CardTitle>
          <CardDescription>
            Using the AI Job Matcher requires {CREDIT_COSTS.job_match} credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">Your Credit Balance</h2>
              <p className="text-sm text-muted-foreground">
                You need {CREDIT_COSTS.job_match} credits to use this feature
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{creditsBalance}</div>
              {creditsBalance < CREDIT_COSTS.job_match && (
                <Button asChild size="sm" className="mt-2">
                  <Link href="/ai-credits">
                    Buy More Credits
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/ai-tools">Back to AI Tools</Link>
          </Button>
          {creditsBalance >= CREDIT_COSTS.job_match ? (
            <Button asChild>
              <Link href="/ai-tools/job-matcher/analyze">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Job Matching
              </Link>
            </Button>
          ) : (
            <Button disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              Insufficient Credits
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
              <div>
                <h3 className="font-medium">Submit Your Resume</h3>
                <p className="text-sm text-muted-foreground">
                  Paste your resume text into our system. The more details you provide, the better the matches will be.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
              <div>
                <h3 className="font-medium">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes your skills, experience, and qualifications to understand your professional profile.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
              <div>
                <h3 className="font-medium">Job Matching</h3>
                <p className="text-sm text-muted-foreground">
                  The AI compares your profile with active job listings and provides personalized match scores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Personalized Matches</h3>
                <p className="text-sm text-muted-foreground">
                  Get job recommendations tailored specifically to your skills and experience.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Save Time</h3>
                <p className="text-sm text-muted-foreground">
                  Focus your job search on positions where you have the highest chance of success.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Identify Skill Gaps</h3>
                <p className="text-sm text-muted-foreground">
                  Discover which skills you might need to develop to qualify for your desired roles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 