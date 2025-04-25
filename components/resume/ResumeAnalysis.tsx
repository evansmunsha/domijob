import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ResumeAnalysisProps {
  analysis: {
    atsScore: number;
    strengths: string[];
    improvements: string[];
    keywords: string[];
  };
}

export function ResumeAnalysis({ analysis }: ResumeAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* ATS Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>ATS Optimization Score</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This score indicates how well your resume is optimized for Applicant Tracking Systems (ATS).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={analysis.atsScore} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {analysis.atsScore >= 80
                ? "Excellent ATS optimization! Your resume should pass most automated screening systems."
                : analysis.atsScore >= 60
                ? "Good ATS optimization. Consider implementing the suggested improvements."
                : "Your resume may have trouble with ATS screening. Please review the suggested improvements."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strengths Card */}
      <Card>
        <CardHeader>
          <CardTitle>Key Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[200px] overflow-y-auto pr-4">
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                  <p className="text-sm">{strength}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Improvements Card */}
      <Card>
        <CardHeader>
          <CardTitle>Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[200px] overflow-y-auto pr-4">
            <ul className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
                  <p className="text-sm">{improvement}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Card */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}