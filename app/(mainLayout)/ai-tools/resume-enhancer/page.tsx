"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Loader2, AlertCircle, FileText, Download, Copy, ArrowLeft } from 'lucide-react'
import { CREDIT_COSTS } from "@/app/utils/credits"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import SignUpModal from "@/components/SignUpModal"

export default function ResumeEnhancerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [enhancedText, setEnhancedText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [creditInfo, setCreditInfo] = useState<{
    isGuest: boolean;
    credits: number;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  // Fetch credit information on page load
  useEffect(() => {
    async function fetchCredits() {
      try {
        const response = await fetch("/api/credits")
        if (!response.ok) throw new Error("Failed to fetch credits")
        const data = await response.json()
        setCreditInfo(data)
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
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setEnhancedText("")
    setError("")
  }

  const handleEnhance = async () => {
    if (!file) {
      setError("Please upload a DOCX or PDF file.")
      return
    }

    // Check if user has enough credits
    if (creditInfo && creditInfo.credits < CREDIT_COSTS.resume_enhancement) {
      if (creditInfo.isGuest) {
        setShowSignUpModal(true)
      } else {
        toast({
          title: "Insufficient Credits",
          description: `You need ${CREDIT_COSTS.resume_enhancement} credits to use this feature.`,
          variant: "destructive",
          id: ""
        })
      }
      return
    }

    setLoading(true)
    setError("")
    setEnhancedText("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/ai/resume-enhance", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        // Handle insufficient credits with signup prompt for guests
        if (res.status === 403) {
          const data = await res.json()
          if (data.requiresSignup) {
            setShowSignUpModal(true)
            throw new Error("You've used all your free credits. Sign up to get 50 more free credits!")
          }
        }
        
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to enhance resume")
      }

      if (!res.body) throw new Error("No response body.")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let creditInfoReceived = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        
        // Check for credit info at the beginning of the stream
        if (!creditInfoReceived && chunk.startsWith("CREDIT_INFO:")) {
          const parts = chunk.split("\n\n")
          const creditInfoJson = parts[0].replace("CREDIT_INFO:", "")
          
          try {
            const updatedCreditInfo = JSON.parse(creditInfoJson)
            setCreditInfo({
              isGuest: updatedCreditInfo.isGuest,
              credits: updatedCreditInfo.remainingCredits
            })
            creditInfoReceived = true
            
            // Add the rest of the text after the credit info
            if (parts.length > 1) {
              setEnhancedText(prev => prev + parts.slice(1).join("\n\n"))
            }
          } catch (e) {
            console.error("Error parsing credit info:", e)
            setEnhancedText(prev => prev + chunk)
          }
        } else {
          setEnhancedText(prev => prev + chunk)
        }
      }

      toast({
        title: "Resume Enhanced",
        description: "Your resume has been successfully enhanced.",
        id: ""
      })
    } catch (err: any) {
      console.error("Error enhancing resume:", err.message)
      setError(err.message || "An error occurred. Please try again.")
      
      toast({
        title: "Error",
        description: err.message || "An error occurred while enhancing your resume",
        variant: "destructive",
        id: ""
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(enhancedText)
    toast({
      title: "Copied",
      description: "Resume text copied to clipboard",
      id: ""
    })
  }

  const handleDownload = () => {
    const blob = new Blob([enhancedText], { type: "text/plain;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "enhanced-resume.txt"
    link.click()
    
    toast({
      title: "Downloaded",
      description: "Resume saved as text file",
      id: ""
    })
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
          <Link href="/ai-tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Tools
          </Link>
        </Button>
        
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Resume Enhancer
        </h1>
        <p className="text-muted-foreground">
          Improve your resume with AI-powered enhancements
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enhance Your Resume</CardTitle>
          <CardDescription>
            Upload your resume and our AI will enhance it to make it more effective. This will use {CREDIT_COSTS.resume_enhancement} credits.
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
            <Label htmlFor="resumeFile">Upload Resume</Label>
            <div className="flex items-center gap-4">
              <input
                id="resumeFile"
                type="file"
                accept=".docx,.pdf"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button 
                onClick={handleEnhance} 
                disabled={loading || !file || (creditInfo?.credits || 0) < CREDIT_COSTS.resume_enhancement}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enhance Resume
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Supported formats: DOCX, PDF
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Your credit balance</p>
                <p className="text-sm text-muted-foreground">
                  This enhancement will cost {CREDIT_COSTS.resume_enhancement} credits
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
          
          {file && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{file.name}</span>
              <span className="text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {enhancedText && (
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Resume</CardTitle>
            <CardDescription>
              Your resume has been enhanced by our AI. You can copy or download the text below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={enhancedText}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download as Text
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Sign Up Modal */}
      <SignUpModal 
        isOpen={showSignUpModal} 
        onClose={() => setShowSignUpModal(false)} 
      />
    </div>
  )
}