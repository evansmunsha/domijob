"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2, AlertCircle, FileText, Download, Copy, ArrowLeft, FileUp } from "lucide-react"
import { CREDIT_COSTS } from "@/app/utils/credits"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import SignUpModal from "@/components/SignUpModal"
import { UploadButton } from "@/components/general/UploadThingReExport"

export default function FileParserPage() {
  const [parsedText, setParsedText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [creditInfo, setCreditInfo] = useState<{
    isGuest: boolean
    credits: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null)

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

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(parsedText)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
      id: ""
    })
  }

  const handleDownload = () => {
    const blob = new Blob([parsedText], { type: "text/plain;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "parsed-text.txt"
    link.click()

    toast({
      title: "Downloaded",
      description: "Text saved as file",
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
          <FileText className="h-8 w-8 text-primary" />
          Document Parser
        </h1>
        <p className="text-muted-foreground">Extract text from PDF and DOCX files for easy editing and analysis</p>
      </div>

      <Card className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="result" disabled={!parsedText}>
              Parsed Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <CardHeader>
              <CardTitle>Upload Your Document</CardTitle>
              <CardDescription>
                Upload a PDF or DOCX file to extract its text content. This will use {CREDIT_COSTS.file_parsing}{" "}
                credits.
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

              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                <FileUp className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Your Document</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your PDF or DOCX file here, or click to browse
                </p>

                <div className="flex flex-col items-center gap-2">
                  {isUploading ? (
                    <Button variant="outline" size="sm" disabled>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Parsing...
                    </Button>
                  ) : (
                    <UploadButton
                      endpoint="resumeUploader"
                      onClientUploadComplete={async (res) => {
                        if (res && res.length > 0) {
                          setIsUploading(true)
                          try {
                            // Check if user has enough credits
                            if (creditInfo && creditInfo.credits < CREDIT_COSTS.file_parsing) {
                              if (creditInfo.isGuest) {
                                setShowSignUpModal(true)
                                throw new Error(
                                  "You've used all your free credits. Sign up to get 50 more free credits!",
                                )
                              } else {
                                throw new Error(`You need ${CREDIT_COSTS.file_parsing} credits to use this feature.`)
                              }
                            }

                            // Log the file URL for debugging
                            console.log("File uploaded successfully:", res[0])

                            // Get the file URL from the response - use ufsUrl as in your implementation
                            const fileUrl = res[0].ufsUrl || res[0].url

                            if (!fileUrl) {
                              throw new Error("File URL not found in upload response")
                            }

                            const response = await fetch("/api/ai/resume-parse", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                fileUrl: fileUrl,
                              }),
                            })

                            if (!response.ok) {
                              if (response.status === 402) {
                                const data = await response.json()
                                if (data.requiresSignup) {
                                  setShowSignUpModal(true)
                                  throw new Error(
                                    "You've used all your free credits. Sign up to get 50 more free credits!",
                                  )
                                }
                              }
                              const errorData = await response.json()
                              throw new Error(errorData.error || "Failed to parse file")
                            }

                            const data = await response.json()
                            setParsedText(data.text)
                            setUploadedFile({ name: res[0].name, size: res[0].size })
                            setActiveTab("result")

                            // Update credit info
                            if (data.remainingCredits !== undefined) {
                              setCreditInfo((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      credits: data.remainingCredits,
                                    }
                                  : null,
                              )
                            }

                            toast({
                              title: "Success",
                              description: "Document parsed successfully!",
                              id: ""
                            })
                          } catch (error) {
                            console.error("Error parsing file:", error)
                            setError(error instanceof Error ? error.message : "Failed to parse file")
                            toast({
                              title: "Error",
                              description: error instanceof Error ? error.message : "Failed to parse file",
                              variant: "destructive",
                              id: ""
                            })
                          } finally {
                            setIsUploading(false)
                          }
                        }
                      }}
                      onUploadError={(error: Error) => {
                        console.error("Upload error:", error)
                        setError(error.message)
                        toast({
                          title: "Upload Error",
                          description: error.message,
                          variant: "destructive",
                          id: ""
                        })
                      }}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">PDF and DOCX files supported (max 2MB)</p>
                </div>

                {uploadedFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{uploadedFile.name}</span>
                    <span className="text-muted-foreground">({Math.round(uploadedFile.size / 1024)} KB)</span>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Your credit balance</p>
                    <p className="text-sm text-muted-foreground">
                      This parsing will cost {CREDIT_COSTS.file_parsing} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{creditInfo?.credits || 0}</span>
                    <span className="text-muted-foreground ml-1">credits</span>
                    {creditInfo?.isGuest && <p className="text-xs text-green-600">Guest credits</p>}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/ai-tools">Cancel</Link>
              </Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="result">
            <CardHeader>
              <CardTitle>Parsed Text</CardTitle>
              <CardDescription>
                The text content has been extracted from your document. You can copy or download it below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={parsedText} readOnly className="min-h-[300px] font-mono text-sm" />

              <div className="mt-4 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">
                  Some formatting may be lost during extraction. Review the text before using it.
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
                Parse Another Document
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download as Text
                </Button>
              </div>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <FileUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">1. Upload Your Document</h3>
              <p className="text-sm text-muted-foreground">
                Upload a PDF or DOCX file that you want to extract text from.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">2. Automatic Extraction</h3>
              <p className="text-sm text-muted-foreground">
                Our system extracts all text content while preserving as much structure as possible.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">3. Use the Text</h3>
              <p className="text-sm text-muted-foreground">
                Copy the extracted text or download it as a file for further editing or analysis.
              </p>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Common Uses</h3>
            <ul className="grid gap-2 md:grid-cols-2">
              <li className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <span className="text-sm">Extract text from documents for editing</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <span className="text-sm">Convert documents to plain text for analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <span className="text-sm">Extract content from resumes for job applications</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <span className="text-sm">Prepare text for use with other AI tools</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Sign Up Modal */}
      <SignUpModal isOpen={showSignUpModal} onClose={() => setShowSignUpModal(false)} />
    </div>
  )
}
