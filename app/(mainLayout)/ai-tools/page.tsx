"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, FileEdit, Search, FileText, ArrowRight, Gift } from "lucide-react"
import { CreditStatus } from "@/components/credit-status"
import { CREDIT_COSTS } from "@/app/utils/credits"

export default function AIToolsPage() {
  const [creditInfo, setCreditInfo] = useState<{
    isGuest: boolean
    credits: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  // Fetch credit information on page load
  useEffect(() => {
    async function fetchCredits() {
      try {
        const response = await fetch("/api/credits")
        if (!response.ok) throw new Error("Failed to fetch credits")
        const data = await response.json()
        setCreditInfo(data)

        // Check if this is a new user (has exactly 50 credits and is not a guest)
        if (!data.isGuest && data.credits === 50) {
          setIsNewUser(true)
        }
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
          AI Tools
        </h1>
        <p className="text-muted-foreground">
          Powered by OpenAI's technology to enhance your job search and application process
        </p>
      </div>

      {/* Credit Status Component */}
      <div className="mb-8">
        {creditInfo ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {creditInfo.isGuest ? "Your Free Credits" : "Your AI Credits"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{creditInfo.credits}</p>
                  {creditInfo.isGuest && <p className="text-sm text-green-600 mt-1">Free trial credits</p>}
                  <p className="text-sm text-muted-foreground mt-1">
                    {creditInfo.isGuest
                      ? "Sign up to get 50 more free credits!"
                      : "Use credits for AI-powered features"}
                  </p>
                </div>

                {creditInfo.isGuest ? (
                  <Button asChild>
                    <Link href="/login">Sign Up</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/ai-credits">Get More Credits</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <CreditStatus />
        )}
      </div>

      {/* New User Welcome Card */}
      {isNewUser && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Welcome to Our AI Tools!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We've given you <span className="font-bold">50 free credits</span> to explore our AI-powered features.
              Here's what you can do with your credits:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Find the perfect job matches ({CREDIT_COSTS.job_match} credits per use)</li>
              <li>Enhance your resume to stand out ({CREDIT_COSTS.resume_enhancement} credits per use)</li>
              <li>Create compelling job descriptions ({CREDIT_COSTS.job_description_enhancement} credits per use)</li>
              <li>Parse documents for easy editing ({CREDIT_COSTS.file_parsing} credits per use)</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              AI Job Matcher
            </CardTitle>
            <CardDescription>Find the perfect jobs matching your skills and experience</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your resume and matches it with job postings to find the best opportunities for you.
            </p>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="outline" className="mr-2">
                {CREDIT_COSTS.job_match} credits per use
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full">
              <Link href="/ai-tools/job-matcher">
                Get Matched
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-primary" />
              Resume Enhancer
            </CardTitle>
            <CardDescription>Improve your resume for better job applications</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground">
              Get personalized suggestions to optimize your resume for ATS systems and increase your chances of landing
              interviews.
            </p>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="outline" className="mr-2">
                {CREDIT_COSTS.resume_enhancement} credits per use
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full">
              <Link href="/ai-tools/resume-enhancer">
                Enhance Resume
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Job Description Enhancer
            </CardTitle>
            <CardDescription>Create compelling job descriptions for recruiters</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground">
              Improve your job postings with AI-enhanced descriptions that attract qualified candidates. Available when
              creating or editing job posts.
            </p>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="outline" className="mr-2">
                {CREDIT_COSTS.job_description_enhancement} credits per use
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full" variant="outline">
              <Link href="/post-job">
                Post a Job
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Document Parser
            </CardTitle>
            <CardDescription>Extract text from PDF and DOCX files</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <p className="text-sm text-muted-foreground">
              Quickly extract text content from your documents for easy editing, analysis, or use with other AI tools.
            </p>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="outline" className="mr-2">
                {CREDIT_COSTS.file_parsing} credits per use
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full">
              <Link href="/ai-tools/file-parser">
                Parse Document
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
