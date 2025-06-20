//components/resume/AIResumeEnhancer.tsx

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  FileText,
  ChevronRight,
  CheckCircle2,
  Award,
  Target,
  Lightbulb,
  Tag,
  Download,
  CreditCard,
  User,
  UserPlus,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { CREDIT_COSTS } from "@/app/utils/credits"
// Remove the SignUpModal import for now
import SignUpModal from "@/components/SignUpModal"
import { trackEvents } from "@/app/utils/analytics"
// 2. Add a simple SignUpModal component implementation if it doesn't exist

export function AIResumeEnhancer() {
  const [resumeText, setResumeText] = useState("")
  const [targetJobTitle, setTargetJobTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [enhancementResult, setEnhancementResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"input" | "results">("input")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [creditInfo, setCreditInfo] = useState<{
    isGuest: boolean
    credits: number
  } | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [rawAIOutput, setRawAIOutput] = useState<string | null>(null);


  



  // Fetch credit information on component mount
  useEffect(() => {
    async function fetchCredits() {
      try {
        // Add error handling for the case when the API endpoint doesn't exist
        const response = await fetch("/api/credits").catch((err) => {
          console.error("Error fetching credits:", err)
          return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500 })
        })

        if (!response.ok) {
          // If the API doesn't exist, use default values
          setCreditInfo({
            isGuest: true,
            credits: 50,
          })
          throw new Error("Failed to fetch credits")
        }

        const data = await response.json()
        setCreditInfo(data)
      } catch (error) {
        console.error("Error fetching credits:", error)
        // Ensure we have fallback data
        if (!creditInfo) {
          setCreditInfo({
            isGuest: true,
            credits: 50,
          })
        }
      } finally {
        setIsLoadingCredits(false)
      }
    }

    fetchCredits()
  }, [])

  // Simulate progress for better UX
  const simulateProgress = () => {
    setProcessingProgress(0)
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 5 + 1
      })
    }, 150)
    return () => clearInterval(interval)
  }

  const enhanceResume = async () => {
    if (!resumeText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your resume text or upload a resume.",
        variant: "destructive",
      });
      return;
    }

    // Track resume enhancement started
    trackEvents.resumeEnhancementStarted();
  
    // ✅ Debug word count and validate length
    const wordCount = resumeText.trim().split(/\s+/).length;
    console.log("Resume word count:", wordCount);
    console.log("Resume length:", resumeText.length);
    console.log("First 200 chars:", resumeText.substring(0, 200));

    if (wordCount > 3500) { // Temporarily increased limit for debugging
      toast({
        title: "Resume Too Long",
        description: `Your resume has ${wordCount} words. Please shorten it to under 3500 words. If this seems wrong, try uploading a DOCX file instead of PDF.`,
        variant: "destructive",
      });
      return;
    }
  
    // ✅ Credit check
    if (creditInfo && creditInfo.credits < CREDIT_COSTS.resume_enhancement) {
      if (creditInfo.isGuest) {
        setShowSignUpModal(true);
        return;
      } else {
        toast({
          title: "Insufficient Credits",
          description: `You need ${CREDIT_COSTS.resume_enhancement} credits to use this feature.`,
          variant: "destructive",
        });
        return;
      }
    }
  
    setIsLoading(true);
    const cleanup = simulateProgress();
    setEnhancementResult(null);
  
    try {
      const response = await fetch("/api/simple-resume-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          targetJobTitle: targetJobTitle.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          if (data.requiresSignup) {
            setShowSignUpModal(true);
            throw new Error("You've used all your free credits. Sign up to get 50 more free credits!");
          }
        }
        throw new Error(data.error || "Failed to enhance resume.");
      }

      // Update credit info
      if (data.remainingCredits !== undefined) {
        setCreditInfo((prev) =>
          prev ? { ...prev, credits: data.remainingCredits } : null
        );
      }

      setEnhancementResult(data);
      setActiveTab("results");

      // Track successful completion
      trackEvents.resumeEnhancementCompleted(
        data.wordCount || resumeText.trim().split(/\s+/).length,
        data.atsScore || 0
      );

      toast({
        title: "Success",
        description: "Resume analysis complete!",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      cleanup();
    }
  };
  
  
  


  const formatResultAsText = (result: any) => {
    let output = `🎯 Resume Analysis Report\n\n`;
  
    output += `📝 Overview:\n${result.overview}\n\n`;
    output += `📊 ATS Score:\n${result.atsScore} / 100\n\n`;
  
    output += `✅ Strengths:\n${result.strengths.map((s: string) => `- ${s}`).join("\n")}\n\n`;
    output += `⚠️ Weaknesses:\n${result.weaknesses.map((w: string) => `- ${w}`).join("\n")}\n\n`;
  
    output += `💡 Suggestions:\n`;
    for (const s of result.suggestions) {
      output += `[${s.section}]\n`;
      for (const i of s.improvements) {
        output += `- ${i}\n`;
      }
      output += `\n`;
    }
  
    output += `🏷️ Recommended Keywords:\n${result.keywords.join(", ")}\n`;
  
    return output;
  };
  
  const handleDownload = () => {
    if (!enhancementResult) return;
  
    const content = formatResultAsText(enhancementResult);
    const blob = new Blob([content], { type: "text/plain" });
  
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-analysis.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  

  const handleDownloadPdf = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return;
  
    const html2pdf = (await import("html2pdf.js")).default;
  
    html2pdf()
      .from(element)
      .set({
        margin: 0.5,
        filename: "resume-analysis.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .save();
  };
  



  

  return (
    <div className="space-y-8">
      {/* Credit Status Display */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border border-primary/10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-full">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Resume Enhancer</h2>
            <p className="text-sm text-muted-foreground">Optimize your resume with AI-powered recommendations</p>
          </div>
        </div>

        {isLoadingCredits ? (
          <div className="animate-pulse h-10 w-32 bg-muted rounded-md"></div>
        ) : (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Credit Balance:</span>
              <span className="text-lg font-bold">{creditInfo?.credits || 0}</span>
            </div>
            {creditInfo?.isGuest ? (
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                  <User className="h-3 w-3" />
                  Guest Credits
                </Badge>
                <Button asChild variant="ghost" size="sm" className="h-6 text-xs ml-2 text-primary">
                  <Link href="/login">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Sign Up for 50 More
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-primary font-medium">{CREDIT_COSTS?.resume_enhancement || 15} credits</span> per
                enhancement
              </div>
            )}
          </div>
        )}
      </div>

      <Card className="border-primary/10 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "input" | "results")}>
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="input" disabled={isLoading} className="rounded-none">
              <FileText className="h-4 w-4 mr-2" />
              Resume Input
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!enhancementResult} className="rounded-none">
              <Sparkles className="h-4 w-4 mr-2" />
              Analysis Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="m-0">
            <CardHeader className="bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Enhance Your Resume
              </CardTitle>
              <CardDescription>
                Get personalized suggestions to improve your resume and increase your chances of landing interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="targetJob" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Target Job Title (Optional)
                </Label>
                <Input
                  id="targetJob"
                  placeholder="e.g. Frontend Developer, Marketing Manager"
                  value={targetJobTitle}
                  onChange={(e) => setTargetJobTitle(e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Providing a specific job title will help tailor recommendations to that role
                </p>
              </div>



              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Resume Text
                </Label>
                <div className="relative">
                  <Textarea
                    placeholder="Paste your resume text here... (Copy from PDF, Word doc, or any text source)"
                    className="min-h-[300px] resize-none border-primary/20 focus-visible:ring-primary"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Copy text from your PDF/Word resume and paste here. Keep under <strong>3500 words</strong> for best results.
                    </p>
                    {resumeText && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>{resumeText.trim().split(/\s+/).length} words</strong>
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/debug-resume-text', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ resumeText })
                              });
                              const data = await response.json();
                              console.log('Resume debug data:', data);
                              toast({
                                title: "Debug Info",
                                description: `${data.analysis.totalWords} words, ${data.analysis.totalLines} lines. Check console for details.`,
                              });
                            } catch (error) {
                              console.error('Debug failed:', error);
                            }
                          }}
                        >
                          Debug
                        </Button>
                      </div>
                    )}
                  </div>

                    {rawAIOutput && (
                      <div className="mt-6 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 rounded-xl p-4 space-y-3">
                        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">⚠️ Partial AI Output</h2>
                        <p className="text-sm text-muted-foreground">
                          The response was too long and got cut off. You can copy it or try again with a shorter resume.
                        </p>
                        <textarea
                          value={rawAIOutput}
                          readOnly
                          className="w-full h-60 p-2 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => navigator.clipboard.writeText(rawAIOutput)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            📋 Copy to Clipboard
                          </button>
                          <button
                            onClick={() => {
                              setRawAIOutput(null);
                              enhanceResume(); // retry
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm"
                          >
                            🔁 Retry
                          </button>
                        </div>
                      </div>
                    )}
                    {isLoading && (
                      <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <div className="text-sm font-medium">Analyzing your resume...</div>
                        <div className="w-48 mt-4">
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${processingProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              {/* Credit cost information */}
              <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium flex items-center">
                      <CreditCard className="h-4 w-4 text-primary mr-2" />
                      Credit Information
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Resume enhancement will cost {CREDIT_COSTS.resume_enhancement} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{creditInfo?.credits || 0}</span>
                    <span className="text-muted-foreground ml-1">credits</span>
                    {creditInfo?.isGuest && <p className="text-xs text-green-600">Guest credits</p>}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 text-amber-500 mr-2" />
                  Resume Enhancement Tips
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Include relevant keywords from the job description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Quantify your achievements with numbers and metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use action verbs to describe your responsibilities</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/20 py-4 px-6">
              <div className="text-sm text-muted-foreground">
                Our AI will analyze your resume and provide personalized recommendations
              </div>
              <Button
                onClick={enhanceResume}
                disabled={isLoading || !resumeText.trim()}
                className="gap-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Enhance Resume
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="results" className="m-0">
            {enhancementResult && (
              <>
                <CardHeader className="bg-muted/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Resume Analysis Results
                      </CardTitle>
                      <CardDescription>{enhancementResult.overview}</CardDescription>
                    </div>
                    <Badge
                      className={`px-3 py-1 text-sm ${
                        enhancementResult.atsScore >= 80
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : enhancementResult.atsScore >= 60
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                      }`}
                    >
                      ATS Score: {enhancementResult.atsScore}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Credit usage information */}
                  {enhancementResult.creditsUsed && (
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {enhancementResult.creditsUsed} credits used for this analysis
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{enhancementResult.remainingCredits}</span> credits remaining
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        ATS Optimization Score
                      </Label>
                      <span
                        className={`text-sm font-medium ${
                          enhancementResult.atsScore >= 80
                            ? "text-green-600"
                            : enhancementResult.atsScore >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {enhancementResult.atsScore}/100
                      </span>
                    </div>
                    <div
                      className={`h-2 w-full rounded-full ${
                        enhancementResult.atsScore >= 80
                          ? "bg-green-100"
                          : enhancementResult.atsScore >= 60
                            ? "bg-amber-100"
                            : "bg-red-100"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          enhancementResult.atsScore >= 80
                            ? "bg-green-600"
                            : enhancementResult.atsScore >= 60
                              ? "bg-amber-600"
                              : "bg-red-600"
                        }`}
                        style={{ width: `${enhancementResult.atsScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {enhancementResult.atsScore >= 80
                        ? "Excellent! Your resume is well-optimized for ATS systems."
                        : enhancementResult.atsScore >= 60
                          ? "Good start. With some improvements, your resume will perform better with ATS systems."
                          : "Your resume needs significant improvements to pass through ATS systems."}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-green-800">
                          <Check className="h-5 w-5 text-green-600" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {enhancementResult.strengths.map((strength: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {enhancementResult.weaknesses.map((weakness: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-primary/10">
                    <CardHeader className="pb-2 bg-muted/20">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Suggested Improvements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 divide-y divide-muted">
                      {enhancementResult.suggestions.map((suggestion: any, i: number) => (
                        <div key={i} className="py-3 first:pt-0 last:pb-0">
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                              {i + 1}
                            </div>
                            {suggestion.section}
                          </h4>
                          <ul className="space-y-1 pl-7">
                            {suggestion.improvements.map((improvement: string, j: number) => (
                              <li key={j} className="text-sm text-muted-foreground list-disc">
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Recommended Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {enhancementResult.keywords.map((keyword: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-primary/10 text-primary hover:bg-primary/20 border-none"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Including these keywords in your resume can improve your chances of passing ATS filters
                    </p>
                  </div>
                </CardContent>
                <CardContent className="p-1">
                <div
                  id="pdf-content"
                  className="w-full max-w-[100%] sm:w-[600px] px-4 sm:px-6 py-6 text-[14px] sm:text-[12px] font-sans text-black space-y-4"
                >
                  {enhancementResult && (
                    <div>
                      {/* Logo + Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <img src="/logo.png" alt="Domijob Logo" className="h-8 w-8" />
                          <h1 className="text-base sm:text-lg font-bold">Domijob Resume Report</h1>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 sm:mt-0 text-left sm:text-right">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>

                      {/* Content */}
                      <p><strong>📝 Overview:</strong><br />{enhancementResult.overview}</p>

                      <p><strong>📊 ATS Score:</strong> {enhancementResult.atsScore} / 100</p>

                      <p><strong>✅ Strengths:</strong></p>
                      <ul className="list-disc list-inside">
                        {enhancementResult.strengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>

                      <p><strong>⚠️ Weaknesses:</strong></p>
                      <ul className="list-disc list-inside">
                        {enhancementResult.weaknesses.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>

                      <p><strong>💡 Suggestions:</strong></p>
                      {enhancementResult.suggestions.map((s: any, i: number) => (
                        <div key={i}>
                          <p className="font-semibold mt-2">[{s.section}]</p>
                          <ul className="list-disc list-inside">
                            {s.improvements.map((imp: string, j: number) => (
                              <li key={j}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      <p><strong>🏷️ Recommended Keywords:</strong><br />
                        {enhancementResult.keywords.join(", ")}
                      </p>

                      {/* Footer */}
                      <div className="mt-6 pt-4 border-t text-xs text-center text-gray-400">
                        Generated by Domijob — <a href="https://domijob.vercel.app">domijob.vercel.app</a>
                      </div>
                    </div>
                  )}
                </div>



                </CardContent>
                <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-between bg-muted/20 py-4 px-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("input")}
                    className="w-full md:w-auto"
                  >
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                    Edit Resume
                  </Button>

                  <Button
                    onClick={handleDownload}
                    className="w-full md:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Analysis
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={handleDownloadPdf}
                    className="w-full md:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </CardFooter>

              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Use our simple modal implementation */}
      <SignUpModal isOpen={showSignUpModal} onClose={() => setShowSignUpModal(false)} />
    </div>
  )
}
