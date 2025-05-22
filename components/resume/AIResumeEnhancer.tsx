 "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Loader2, Check, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { UploadButton } from "@/components/general/UploadThingReExport";

export function AIResumeEnhancer() {
  const [resumeText, setResumeText] = useState("");
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<any>(null);

  const enhanceResume = async () => {
    if (!resumeText.trim()) {
      toast.error("Please enter your resume text or upload a resume");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/resume-enhancer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          resumeText,
          targetJobTitle: targetJobTitle.trim() || undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enhance resume");
      }

      const data = await response.json();
      setEnhancementResult(data);
      toast.success("Resume analysis complete!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze resume");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Resume Enhancer
          </CardTitle>
          <CardDescription>
            Get personalized suggestions to improve your resume and increase your chances of landing interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetJob">Target Job Title (Optional)</Label>
            <Input
              id="targetJob"
              placeholder="e.g. Frontend Developer, Marketing Manager"
              value={targetJobTitle}
              onChange={(e) => setTargetJobTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Providing a specific job title will help tailor recommendations to that role
            </p>
          </div>
          <div className="space-y-2">
            <Label>Resume Text</Label>
            <Textarea 
              placeholder="Paste your resume text here..." 
              className="min-h-[200px]"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            
            {uploadedFile && (
              <div className="mt-2 text-sm flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
                        setIsUploading(true);
                        try {
                          const response = await fetch("/api/ai/resume-parse", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              fileUrl: res[0].ufsUrl
                            }),
                          });
                          
                          if (!response.ok) {
                            throw new Error("Failed to parse resume");
                          }
                          
                          const data = await response.json();
                          setResumeText(data.text);
                          setUploadedFile({ name: res[0].name, size: res[0].size });
                          toast.success("Resume parsed successfully!");
                        } catch (error) {
                          console.error(error);
                          toast.error(`Failed to parse resume: ${error instanceof Error ? error.message : "Unknown error"}`);
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload error: ${error.message}`);
                    }}
                  />
                )}
                <span className="text-xs text-muted-foreground">Accepts PDF or Word</span>
              </div>
              <Button 
                onClick={enhanceResume} 
                disabled={isLoading || isUploading || !resumeText.trim()}
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Enhance Resume
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {enhancementResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resume Analysis Results</CardTitle>
            <CardDescription>{enhancementResult.overview}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ATS Optimization Score</Label>
                <span className="text-sm font-medium">{enhancementResult.atsScore}/100</span>
              </div>
              <Progress value={enhancementResult.atsScore} />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Strengths</h3>
                <ul className="space-y-1">
                  {enhancementResult.strengths.map((strength: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Areas for Improvement</h3>
                <ul className="space-y-1">
                  {enhancementResult.weaknesses.map((weakness: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Suggested Improvements</h3>
              {enhancementResult.suggestions.map((suggestion: any, i: number) => (
                <div key={i} className="space-y-2">
                  <h4 className="text-sm font-medium">{suggestion.section}</h4>
                  <ul className="space-y-1 pl-5 list-disc">
                    {suggestion.improvements.map((improvement: string, j: number) => (
                      <li key={j} className="text-sm text-muted-foreground">{improvement}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Recommended Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {enhancementResult.keywords.map((keyword: string, i: number) => (
                  <div 
                    key={i} 
                    className="bg-muted px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    {keyword}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}