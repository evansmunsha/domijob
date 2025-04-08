"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, CheckCircle, Clock, XCircle } from "lucide-react"

interface ApplicationInsightsProps {
  jobId: string
}

interface InsightsData {
  totalApplicants: number
  applicantsWithSimilarSkills: number
  userSkillMatch: number
  averageExperience: number
  applicationStatus: {
    pending: number
    reviewing: number
    shortlisted: number
    rejected: number
  }
}

export function ApplicationInsights({ jobId }: ApplicationInsightsProps) {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true)
        const response = await fetch(`/api/jobs/${jobId}/insights`)

        if (!response.ok) {
          if (response.status === 401) {
            setError("Please sign in to view application insights")
          } else if (response.status === 403) {
            setError("You must apply to this job to view insights")
          } else {
            setError("Failed to load application insights")
          }
          return
        }

        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching application insights:", error)
        setError("An error occurred while loading insights")
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [jobId])

  if (loading) {
    return <ApplicationInsightsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Insights</CardTitle>
        <CardDescription>How you compare to other applicants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Total Applicants</span>
            <span className="font-medium">{data.totalApplicants}</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Applicants with similar skills</span>
            <span className="font-medium">{data.applicantsWithSimilarSkills}</span>
          </div>
          <Progress value={(data.applicantsWithSimilarSkills / data.totalApplicants) * 100} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Your skill match</span>
            <span className="font-medium">{data.userSkillMatch}%</span>
          </div>
          <Progress value={data.userSkillMatch} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {data.userSkillMatch >= 80
              ? "Your skills are an excellent match for this position!"
              : data.userSkillMatch >= 60
                ? "Your skills match well with this position."
                : "Consider developing more relevant skills for this role."}
          </p>
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-medium mb-3">Application Status Breakdown</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-7 gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Pending</span>
              </Badge>
              <span className="text-sm">{data.applicationStatus.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-7 gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <Users className="h-3.5 w-3.5" />
                <span>Reviewing</span>
              </Badge>
              <span className="text-sm">{data.applicationStatus.reviewing}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-7 gap-1 bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Shortlisted</span>
              </Badge>
              <span className="text-sm">{data.applicationStatus.shortlisted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-7 gap-1 bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-3.5 w-3.5" />
                <span>Rejected</span>
              </Badge>
              <span className="text-sm">{data.applicationStatus.rejected}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationInsightsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Insights</CardTitle>
        <CardDescription>How you compare to other applicants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-3/4 mt-1" />
        </div>

        <div className="pt-2">
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
