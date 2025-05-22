"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle } from 'lucide-react'
import Link from "next/link"
import { CREDIT_COSTS } from "@/app/utils/credits"
import { useRouter } from "next/navigation"

export default function JobMatcherPage() {
  const router = useRouter()
  const [creditInfo, setCreditInfo] = useState<{
    isGuest: boolean;
    credits: number;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch credit information for both authenticated and anonymous users
    async function fetchCredits() {
      try {
        const response = await fetch("/api/credits")
        if (!response.ok) throw new Error("Failed to fetch credits")
        const data = await response.json()
        setCreditInfo(data)
      } catch (error) {
        console.error("Error fetching credits:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCredits()
  }, [])

  if (isLoading) {
    return (
      <div className="container py-10 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

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
              <div className="text-2xl font-bold">{creditInfo?.credits || 0}</div>
              {creditInfo && creditInfo.credits < CREDIT_COSTS.job_match && (
                creditInfo.isGuest ? (
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/signup">Sign Up for 50 Free Credits</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/ai-credits">Buy More Credits</Link>
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/ai-tools">Back to AI Tools</Link>
          </Button>
          {creditInfo && creditInfo.credits >= CREDIT_COSTS.job_match ? (
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-medium">
                    {["Submit Your Resume", "AI Analysis", "Job Matching"][i]}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {[
                      "Paste your resume text into our system. The more details you provide, the better the matches will be.",
                      "Our AI analyzes your skills, experience, and qualifications to understand your professional profile.",
                      "The AI compares your profile with active job listings and provides personalized match scores."
                    ][i]}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Personalized Matches",
              "Save Time",
              "Identify Skill Gaps"
            ].map((title, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[
                      "Get job recommendations tailored specifically to your skills and experience.",
                      "Focus your job search on positions where you have the highest chance of success.",
                      "Discover which skills you might need to develop to qualify for your desired roles."
                    ][i]}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}