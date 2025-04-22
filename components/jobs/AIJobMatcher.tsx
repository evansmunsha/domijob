 "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@/components/general/UploadThingReExport";

export function AIJobMatcher() {
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [matches, setMatches] = useState<any[]>([]);

  const findMatches = async () => {
    if (!resumeText.trim()) {
      toast.error("Please enter your resume text or upload a resume");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/job-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to match jobs");
      }

      const data = await response.json();
      setMatches(data.matches || []);
      
      if (data.matches.length === 0) {
        toast.info("No matching jobs found. Try updating your resume with more skills.");
      } else {
        toast.success(`Found ${data.matches.length} matching jobs!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to find matching jobs");
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
            AI Job Matching
          </CardTitle>
          <CardDescription>
            Let our AI find the perfect jobs that match your skills and experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Paste your resume text or upload a file</label>
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
                              fileUrl: res[0].url
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
                onClick={findMatches} 
                disabled={isLoading || isUploading || !resumeText.trim()}
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Matching...
                  </>
                ) : (
                  <>
                    Find Matching Jobs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Job Matches</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <Card key={match.jobId} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-bl-md"
                  style={{ opacity: match.score / 100 }}
                >
                  {match.score}% Match
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="font-bold">{match.job.title}</h3>
                    <div className="text-sm">{match.job.company} • {match.job.location}</div>
                    <div className="text-sm text-muted-foreground">{match.reason}</div>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}