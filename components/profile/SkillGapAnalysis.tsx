"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, ExternalLink } from "lucide-react"

interface SkillGapAnalysisProps {
  userId: string
  currentSkills: string[]
}

interface SkillResource {
  id: string
  title: string
  url: string
  type: string
}

interface Skill {
  name: string
  description: string
  demandLevel: "high" | "medium" | "low"
  learningResources: SkillResource[]
}

interface AnalysisResult {
  currentSkills: string[]
  missingSkills: Skill[]
  completeness: number
}

export function SkillGapAnalysis({ userId, currentSkills }: SkillGapAnalysisProps) {
  const [targetJob, setTargetJob] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    if (!targetJob.trim()) {
      toast.error("Please enter a target job title")
      return
    }

    setIsAnalyzing(true)
    try {
      // First approach: Use the API endpoint
      const response = await fetch("/api/skills/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          targetJobTitle: targetJob,
          currentSkills,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze skills")
      }

      const data = await response.json()
      setResults(data)

      // Second approach: Trigger the Inngest function
      // This will send an email with the results
      try {
        await fetch("/api/trigger-skill-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            targetJobTitle: targetJob,
          }),
        })
        toast.success("Skill gap analysis complete. You'll also receive the results by email.")
      } catch (emailError) {
        console.error("Error sending email analysis:", emailError)
        toast.success("Skill gap analysis complete.")
      }
    } catch (error) {
      console.error("Analysis error:", error)
      toast.error("Failed to analyze skill gaps")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getDemandLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-green-50 text-green-700 border-green-200"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return ""
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Skill Gap Analysis</CardTitle>
        <CardDescription>See what skills you need to develop for your target role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your target job title (e.g., Senior Frontend Developer)"
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={isAnalyzing || !targetJob.trim()}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>

          {results && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Skills Completeness</h3>
                <Progress value={results.completeness} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  You have {results.currentSkills.length} of{" "}
                  {results.currentSkills.length + results.missingSkills.length} recommended skills
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Skills to Develop</h3>
                <div className="space-y-3">
                  {results.missingSkills.map((skill) => (
                    <div key={skill.name} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{skill.name}</h4>
                        <Badge variant="outline" className={getDemandLevelColor(skill.demandLevel)}>
                          {skill.demandLevel} demand
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
                      {skill.learningResources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Learning Resources:</p>
                          <ul className="text-sm mt-1 space-y-1">
                            {skill.learningResources.slice(0, 2).map((resource) => (
                              <li key={resource.id} className="flex items-center">
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center"
                                >
                                  {resource.title}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {resource.type}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

