"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download } from "lucide-react";

const JobMatcherPage = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobTitles, setJobTitles] = useState(["", "", ""]);
  const [jobDescriptions, setJobDescriptions] = useState(["", "", ""]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    try {
      const jobs = jobTitles.map((title, i) => ({
        title,
        description: jobDescriptions[i],
      }));
      const res = await fetch("/api/ai/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescriptions: jobs }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Matching failed.");
      } else {
        setResults(data.matches);
        toast.success("Resume analyzed successfully!");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job-match-results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const csv = [
      ["Title", "Match Score", "Explanation", "Missing Keywords"],
      ...results.map(r => [
        r.title,
        r.matchScore,
        `"${r.explanation.replace(/"/g, "'")}"`,
        `"${(r.missingKeywords || []).join(", ").replace(/"/g, "'")}"`
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job-match-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Resume Job Matcher</h1>
      
      <div>
        <Label htmlFor="resume">Paste your resume</Label>
        <Textarea
          id="resume"
          rows={10}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here..."
        />
      </div>

      {jobTitles.map((_, i) => (
        <div key={i} className="space-y-2">
          <Label>Job {i + 1}</Label>
          <Input
            placeholder="Job title"
            value={jobTitles[i]}
            onChange={(e) => {
              const copy = [...jobTitles];
              copy[i] = e.target.value;
              setJobTitles(copy);
            }}
          />
          <Textarea
            placeholder="Job description"
            rows={4}
            value={jobDescriptions[i]}
            onChange={(e) => {
              const copy = [...jobDescriptions];
              copy[i] = e.target.value;
              setJobDescriptions(copy);
            }}
          />
        </div>
      ))}

      <Button disabled={loading || !resumeText} onClick={handleMatch}>
        {loading ? "Analyzing..." : "Match Jobs"}
      </Button>

      {results.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="secondary" onClick={exportJSON}>
                <Download className="mr-2 h-4 w-4" /> Export JSON
              </Button>
            </div>
          </div>

          {results.map((match, i) => (
            <div key={i} className="border p-4 rounded-lg bg-muted">
              <h3 className="text-lg font-bold">{match.title}</h3>
              <p><strong>Score:</strong> {match.matchScore}/100</p>
              <p><strong>Explanation:</strong> {match.explanation}</p>
              <p><strong>Missing Keywords:</strong> {match.missingKeywords?.join(", ") || "None"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobMatcherPage;







/*

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
import { Sparkles, Loader2, AlertCircle, CheckCircle, Building, MapPin, Clock, DollarSign, ThumbsUp, ArrowLeft, AlertTriangle } from 'lucide-react'
import { CREDIT_COSTS } from "@/app/utils/credits"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import SignUpModal from "@/components/SignUpModal"

export default function JobMatcherAnalyzePage() {
  const router = useRouter()
  const [resumeText, setResumeText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [error, setError] = useState("")
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [activeTab, setActiveTab] = useState("input")
  const [creditInfo, setCreditInfo] = useState<{ isGuest: boolean; credits: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  useEffect(() => {
    if (activeTab === "results") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    async function fetchCredits() {
      try {
        const response = await fetch("/api/credits")
        if (!response.ok) throw new Error("Failed to fetch credits")
        const data = await response.json()
        setCreditInfo(data)

        if (data.credits < CREDIT_COSTS.job_match) {
          if (data.isGuest) {
            toast({
              title: "Insufficient Credits",
              description: "Sign up to get 50 more free credits!",
              variant: "destructive",
              id: ""
            })
          } else {
            toast({
              title: "Insufficient Credits",
              description: `You need ${CREDIT_COSTS.job_match} credits to use this feature.`,
              variant: "destructive",
              id: ""
            })
            router.push("/ai-credits")
          }
        }
      } catch (error) {
        console.error("Error fetching credits:", error)
        toast({
          title: "Error",
          description: "Failed to fetch your credit balance",
          variant: "destructive",
          id: ""
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCredits()
  }, [router, activeTab])

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data.requiresSignup) {
          setShowSignUpModal(true)
          throw new Error("You've used all your free credits. Sign up to get 50 more free credits!")
        }

        throw new Error(data.error || "Failed to analyze resume")
      }

      setMatches(data.matches || [])
      setCreditsUsed(data.creditsUsed || CREDIT_COSTS.job_match)
      setCreditInfo(prev => prev ? { ...prev, credits: data.remainingCredits } : null)
      setActiveTab("results")

      toast({
        title: "Analysis Complete",
        description: `Found ${data.matches?.length || 0} job matches for your profile.`,
        id: ""
      })
    } catch (error: any) {
      console.error("Error analyzing resume:", error)
      setError(error.message || "An error occurred while analyzing your resume")

      toast({
        title: "Error",
        description: error.message || "An error occurred while analyzing your resume",
        variant: "destructive",
        id: ""
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
                    <span className="text-lg font-bold">{creditInfo?.credits || 0}</span>
                    <span className="text-muted-foreground ml-1">credits</span>
                    {creditInfo?.isGuest && (
                      <p className="text-xs text-green-600">Guest credits</p>
                    )}
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
                disabled={isAnalyzing || !resumeText.trim() || (creditInfo?.credits || 0) < CREDIT_COSTS.job_match}
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
                      Used {creditsUsed} credits for this analysis. Your remaining balance: {creditInfo?.credits || 0} credits.
                      {creditInfo?.isGuest && " Sign up to get 50 more free credits!"}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    {matches.map((match, index) => (
                      <Card key={match.jobId || index} className="overflow-hidden">
                        <div className="bg-primary/5 px-6 py-3 flex justify-between items-center">
                          <div className="font-medium">Match Score</div>
                          <Badge 
                            variant={match.score >= 80 ? "default" : "outline"}
                            className={match.score >= 80 ? "bg-green-600" : ""}
                          >
                            {match.score}%
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
                              {formatDate(match.job?.createdAt)}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatSalary(match.job?.salaryRange)}
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
                              <div className="flex flex-wrap gap-2">
                                {match.missingSkills.map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
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
      
      
      <SignUpModal 
        isOpen={showSignUpModal} 
        onClose={() => setShowSignUpModal(false)} 
      />
    </div>
  )
} */