"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Copy,
  ArrowLeft,
  FileUp,
  Clipboard,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"
import { CREDIT_COSTS } from "@/app/utils/credits"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import SignUpModal from "@/components/SignUpModal"
import { UploadButton } from "@/components/general/UploadThingReExport"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function FileParserPage() {
  const [parsedText, setParsedText] = useState("")
  const [manualText, setManualText] = useState("")
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
  const [inputMethod, setInputMethod] = useState<"upload" | "paste">("upload")
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

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

  // Calculate word and character counts when parsed text changes
  useEffect(() => {
    if (parsedText) {
      setWordCount(parsedText.split(/\s+/).filter(Boolean).length)
      setCharCount(parsedText.length)
    }
  }, [parsedText])

  const simulateProgress = () => {
    setProcessingProgress(0)
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 100)
    return () => clearInterval(interval)
  }

  const handleManualTextSubmit = () => {
    if (!manualText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to process",
        variant: "destructive",
        id: ""
      })
      return
    }

    setIsUploading(true)
    const cleanup = simulateProgress()

    // Simulate processing delay for better UX
    setTimeout(() => {
      setParsedText(manualText)
      setActiveTab("result")
      setIsUploading(false)
      cleanup()

      toast({
        title: "Success",
        description: "Text processed successfully!",
        id: ""
      })

      // Calculate stats
      setWordCount(manualText.split(/\s+/).filter(Boolean).length)
      setCharCount(manualText.length)
    }, 1500)
  }

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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Document Parser
            </h1>
            <p className="text-muted-foreground">
              Extract and process text from documents for easy editing and analysis
            </p>
          </div>
          {creditInfo && (
            <div className="bg-muted/40 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Credit Balance</div>
              <div className="text-2xl font-bold">{creditInfo.credits}</div>
              {creditInfo.isGuest && <div className="text-xs text-green-600">Free trial credits</div>}
            </div>
          )}
        </div>
      </div>

      <Card className="mb-8 overflow-hidden border-primary/10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="rounded-none">
              <FileUp className="h-4 w-4 mr-2" />
              Input Text
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!parsedText} className="rounded-none">
              <FileText className="h-4 w-4 mr-2" />
              Processed Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="m-0">
            <CardHeader className="bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Get Text from Your Document
              </CardTitle>
              <CardDescription>
                Upload a DOCX file or paste text directly. File parsing will use {CREDIT_COSTS.file_parsing} credits.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-2 mb-4">
                <Button
                  variant={inputMethod === "upload" ? "default" : "outline"}
                  onClick={() => setInputMethod("upload")}
                  size="sm"
                  className="rounded-full"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  variant={inputMethod === "paste" ? "default" : "outline"}
                  onClick={() => setInputMethod("paste")}
                  size="sm"
                  className="rounded-full"
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Paste Text
                </Button>
              </div>

              {inputMethod === "upload" ? (
                <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center bg-muted/10">
                  <FileUp className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Your Document</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Drag and drop your DOCX file here, or click to browse
                  </p>

                  <div className="flex flex-col items-center gap-3">
                    {isUploading ? (
                      <div className="w-full max-w-xs space-y-4">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span>Processing document...</span>
                          <span>{processingProgress}%</span>
                        </div>
                        <Progress value={processingProgress} className="h-2" />
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="resumeUploader"
                        onClientUploadComplete={async (res) => {
                          if (res && res.length > 0) {
                            const uploaded = res[0];
                            const fileName = uploaded.name.toLowerCase();
                        
                            // ✅ Check file extension before calling the API
                            if (!fileName.endsWith(".docx")) {
                              setError("Only DOCX files are supported. Please upload a valid .docx file.");
                              toast({
                                title: "Unsupported File Type",
                                description: "Only DOCX files are supported. Please upload a valid .docx file.",
                                variant: "destructive",
                              });
                              return;
                            }
                        
                            setIsUploading(true);
                            const cleanup = simulateProgress();
                        
                            try {
                              if (creditInfo && creditInfo.credits < CREDIT_COSTS.file_parsing) {
                                if (creditInfo.isGuest) {
                                  setShowSignUpModal(true);
                                  throw new Error("You've used all your free credits. Sign up to get 50 more free credits!");
                                } else {
                                  throw new Error(`You need ${CREDIT_COSTS.file_parsing} credits to use this feature.`);
                                }
                              }
                        
                              const fileUrl = uploaded.ufsUrl || uploaded.ufsUrl
                              console.log("Resume Parse fileUrl:", fileUrl);

                              if (!fileUrl) throw new Error("File URL not found in upload response");
                              
                        
                              const response = await fetch("/api/ai/resume-parse", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ fileUrl }),
                              });
                        
                              if (!response.ok) {
                                if (response.status === 402) {
                                  const data = await response.json();
                                  if (data.requiresSignup) {
                                    setShowSignUpModal(true);
                                    throw new Error("You've used all your free credits. Sign up to get 50 more free credits!");
                                  }
                                }
                                const errorData = await response.json();
                                throw new Error(errorData.error || "Failed to parse file");
                              }
                        
                              const data = await response.json();
                              setParsedText(data.text);
                              setUploadedFile({ name: uploaded.name, size: uploaded.size });
                        
                              if (data.remainingCredits !== undefined) {
                                setCreditInfo((prev) =>
                                  prev ? { ...prev, credits: data.remainingCredits } : null
                                );
                              }
                        
                              setActiveTab("result");
                        
                              toast({
                                title: "Success",
                                description: "Document parsed successfully!",
                                icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
                              });
                            } catch (error) {
                              console.error("Error parsing file:", error);
                              setError(error instanceof Error ? error.message : "Failed to parse file");
                              toast({
                                title: "Error",
                                description: error instanceof Error ? error.message : "Failed to parse file",
                                variant: "destructive",
                              });
                            } finally {
                              setIsUploading(false);
                              cleanup();
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
                    <p className="text-xs text-muted-foreground mt-2">Only DOCX files are supported (max 2MB)</p>
                  </div>

                  {uploadedFile && !isUploading && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-primary/5 text-primary">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder="Paste your resume or document text here..."
                      className="min-h-[300px] resize-none border-primary/20 focus-visible:ring-primary"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <div className="text-sm font-medium">Processing text...</div>
                        <div className="w-48 mt-4">
                          <Progress value={processingProgress} className="h-2" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <strong>Tip:</strong> If you have a PDF file, copy the text and paste it here.
                    </div>
                    <Button
                      onClick={handleManualTextSubmit}
                      disabled={!manualText.trim() || isUploading}
                      className="gap-1"
                    >
                      Process Text
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {inputMethod === "upload" && (
                <div className="bg-muted/30 p-4 rounded-lg mt-6 border border-primary/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium flex items-center">
                        <Sparkles className="h-4 w-4 text-primary mr-2" />
                        Credit Information
                      </p>
                      <p className="text-sm text-muted-foreground">
                        File parsing will cost {CREDIT_COSTS.file_parsing} credits
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{creditInfo?.credits || 0}</span>
                      <span className="text-muted-foreground ml-1">credits</span>
                      {creditInfo?.isGuest && <p className="text-xs text-green-600">Guest credits</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/20 py-4 px-6">
              <Button variant="outline" asChild>
                <Link href="/ai-tools">Cancel</Link>
              </Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="result" className="m-0">
            <CardHeader className="bg-muted/20">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Processed Text
                  </CardTitle>
                  <CardDescription>The text content has been extracted and is ready to use</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-muted/50">
                    {wordCount} words
                  </Badge>
                  <Badge variant="outline" className="bg-muted/50">
                    {charCount} characters
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <Textarea
                  value={parsedText}
                  readOnly
                  className="min-h-[350px] font-mono text-sm resize-none border-primary/20 bg-muted/10"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button size="icon" variant="ghost" onClick={handleCopyToClipboard} className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleDownload} className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-amber-800">
                  Some formatting may be lost during extraction. Review the text before using it.
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/20 py-4 px-6">
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
                Process Another Document
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

      <Card className="border-primary/10">
        <CardHeader className="bg-muted/10">
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 bg-muted/10 rounded-lg border border-primary/10">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <FileUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">1. Get Your Text</h3>
              <p className="text-sm text-muted-foreground">
                Upload a DOCX file or paste text directly from your document.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-muted/10 rounded-lg border border-primary/10">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">2. Process Content</h3>
              <p className="text-sm text-muted-foreground">
                Our system extracts and processes the text content for easy use.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-muted/10 rounded-lg border border-primary/10">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">3. Use the Text</h3>
              <p className="text-sm text-muted-foreground">
                Copy the extracted text or download it as a file for further editing or analysis.
              </p>
            </div>
          </div>

          <div className="bg-muted/20 p-6 rounded-lg border border-primary/10">
            <h3 className="font-medium mb-4 flex items-center">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              Common Uses
            </h3>
            <ul className="grid gap-3 md:grid-cols-2">
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
