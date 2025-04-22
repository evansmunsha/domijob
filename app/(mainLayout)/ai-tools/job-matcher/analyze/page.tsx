"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { 
  Sparkles, Loader2, AlertCircle, CheckCircle, 
  Building, MapPin, Clock, DollarSign, ThumbsUp,
  ArrowLeft, AlertTriangle
} from "lucide-react"
import { CREDIT_COSTS } from "@/app/utils/credits"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export default function JobMatcherAnalyzePage() {
  const router = useRouter()
  const [resumeText, setResumeText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [error, setError] = useState("")
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [activeTab, setActiveTab] = useState("input")
  const [remainingCredits, setRemainingCredits] = useState(0)
  
  // Fetch user credits on page load
  useEffect(() => {
    // Check if user is logged in
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (!data?.user) {
          router.push("/login")
        }
      })
      .catch(err => {
        console.error("Error checking session:", err)
        router.push("/login")
      })
    
    // Fetch user's credit balance
    fetch("/api/user/credits")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch credits")
        return res.json()
      })
      .then(data => {
        setRemainingCredits(data.balance || 0)
        
        if ((data.balance || 0) < CREDIT_COSTS.job_match) {
          toast({
            title: "Insufficient Credits",
            description: `You need ${CREDIT_COSTS.job_match} credits to use this feature.`,
            variant: "destructive"
          })
          router.push("/ai-credits")
        }
      })
      .catch(err => {
        console.error("Error fetching credits:", err)
        toast({
          title: "Error",
          description: "Failed to fetch your credit balance",
          variant: "destructive"
        })
      })
  }, [router])
  
  async function handleAnalyzeResume() {
    if (!resumeText.trim()) {
      setError("Please enter your resume text")
      return
    }
    
    setIsAnalyzing(true)
    setError("")
    
    try {
      const response = await fetch("/api/ai/match-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resumeText })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume")
      }
      
      setMatches(data.matches || [])
      setCreditsUsed(data.creditsUsed || CREDIT_COSTS.job_match)
      setRemainingCredits(prev => prev - (data.creditsUsed || CREDIT_COSTS.job_match))
      setActiveTab("results")
      
      toast({
        title: "Analysis Complete",
        description: `Found ${data.matches?.length || 0} job matches for your profile.`,
      })
    } catch (error: any) {
      console.error("Error analyzing resume:", error)
      setError(error.message || "An error occurred while analyzing your resume")
      
      toast({
        title: "Error",
        description: error.message || "An error occurred while analyzing your resume",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  function formatSalary(salary: string | null) {
    if (!salary) return "Not specified"
    return salary
  }
  
  function formatDate(dateString: string) {
    if (!dateString) return "Recent"
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }
  
  return (
    <div className="container py-10 max-w-6xl">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/ai-tools/job-matcher">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Matcher
          </Link>
        </Button>
        
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Job Matcher
        </h1>
        <p className="text-muted-foreground">
          Let our AI analyze your resume and match you with the most suitable jobs
        </p>
      </div>
      
      <Card className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Resume Input</TabsTrigger>
            <TabsTrigger value="results" disabled={matches.length === 0 && !isAnalyzing}>
              Match Results {matches.length > 0 && `(${matches.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="input">
            <CardHeader>
              <CardTitle>Submit Your Resume</CardTitle>
              <CardDescription>
                Enter your resume text below for AI analysis. This will use {CREDIT_COSTS.job_match} credits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="resumeText">Resume Text</Label>
                <Textarea
                  id="resumeText"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[300px]"
                />
                <p className="text-sm text-muted-foreground">
                  For best results, include your skills, experience, education, and job history.
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Your credit balance</p>
                    <p className="text-sm text-muted-foreground">
                      This analysis will cost {CREDIT_COSTS.job_match} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{remainingCredits}</span>
                    <span className="text-muted-foreground ml-1">credits</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/ai-tools">Cancel</Link>
              </Button>
              <Button 
                onClick={handleAnalyzeResume} 
                disabled={isAnalyzing || !resumeText.trim() || remainingCredits < CREDIT_COSTS.job_match}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Match Jobs
                  </>
                )}
              </Button>
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="results">
            <CardHeader>
              <CardTitle>Job Match Results</CardTitle>
              <CardDescription>
                We found {matches.length} potential matches for your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isAnalyzing ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="font-medium">Analyzing your resume and matching with jobs...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a minute</p>
                </div>
              ) : matches.length > 0 ? (
                <>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Analysis Complete</AlertTitle>
                    <AlertDescription>
                      Used {creditsUsed} credits for this analysis. Your remaining balance: {remainingCredits} credits.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    {matches.map((match, index) => (
                      <Card key={match.jobId || index} className="overflow-hidden">
                        <div className="bg-primary/5 px-6 py-3 flex justify-between items-center">
                          <div className="font-medium">Match Score</div>
                          <Badge 
                            variant={match.matchScore >= 80 ? "default" : "outline"}
                            className={match.matchScore >= 80 ? "bg-green-600" : ""}
                          >
                            {match.matchScore}%
                          </Badge>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle>{match.job?.title}</CardTitle>
                          <CardDescription className="flex flex-wrap gap-y-1 gap-x-4 mt-2">
                            <span className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {match.job?.company || "Unknown Company"}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {match.job?.location || "Not specified"}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(match.job?.postedAt)}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatSalary(match.job?.salary)}
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium flex items-center mb-2">
                              <ThumbsUp className="h-4 w-4 mr-2 text-green-600" />
                              Why You're a Good Match
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {match.reasons && match.reasons.map((reason: string, idx: number) => (
                                <li key={idx} className="text-sm">{reason}</li>
                              ))}
                            </ul>
                          </div>
                          
                          {match.missingSkills && match.missingSkills.length > 0 && (
                            <div>
                              <h4 className="font-medium flex items-center mb-2">
                                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                                Areas for Improvement
                              </h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {match.missingSkills.map((skill: string, idx: number) => (
                                  <li key={idx} className="text-sm">{skill}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <Link 
                            href={`/jobs/${match.jobId}`}
                            className="inline-block text-sm text-primary hover:underline mt-2"
                          >
                            View Full Job Details
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium text-lg mb-2">No Matches Found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find any suitable job matches based on your resume. Try adding more details to your resume or check back later for new job listings.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("input")}>
                Back to Resume
              </Button>
              <Button variant="outline" asChild>
                <Link href="/ai-tools">Return to AI Tools</Link>
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 