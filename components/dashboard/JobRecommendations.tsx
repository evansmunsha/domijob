"use client"
//@typescript-eslint/no-unused-vars
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Building2, Search, Loader2 } from "lucide-react"
import Image from "next/image"

interface Job {
  id: string
  jobTitle: string
  employmentType: string
  location: string
  createdAt: string
  company: {
    name: string
    logo: string | null
  }
}

export function JobRecommendations() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecommendedJobs() {
      try {
        setLoading(true)
        // In a real app, you would fetch from your API
        const response = await fetch("/api/jobs/recommended")

        if (response.ok) {
          const data = await response.json()
          setJobs(data)
        } else {
          // If API fails, use empty array
          setJobs([])
        }
      } catch (error) {
        console.error("Error fetching job recommendations:", error)
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendedJobs()
  }, [])

  // Helper function to check if a job is new (posted within the last 7 days)
  const isNewJob = (createdAt: string) => {
    if (!createdAt) return false
    const jobDate = new Date(createdAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return jobDate > sevenDaysAgo
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Jobs</CardTitle>
        <CardDescription>Jobs that match your profile and interests</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  {job.company.logo ? (
                    <Image
                    src={job.company.logo || "/placeholder.svg"}
                    alt={job.company.name}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                  ) : (
                    <Building2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">
                    <Link href={`/job/${job.id}`} className="hover:underline">
                      {job.jobTitle}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">{job.company.name}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{job.employmentType}</Badge>
                    <Badge variant="outline">{job.location}</Badge>
                    {isNewJob(job.createdAt) && (
                      <Badge variant="default" className="bg-green-500">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/job/${job.id}`}>View Job</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No recommended jobs yet</h3>
            <p className="text-muted-foreground mb-4">
              We&apos;ll show personalized job recommendations here as they become available
            </p>
            <Button asChild>
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

