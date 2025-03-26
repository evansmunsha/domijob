"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Building2, Calendar, Clock, Loader2 } from "lucide-react"
import React from "react"
import { ApplicationInsights } from "@/components/job/ApplicationInsights"

// Helper function to get status badge variant based on application status
function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "PENDING":
      return "outline"
    case "REVIEWING":
      return "secondary"
    case "SHORTLISTED":
      return "default"
    case "REJECTED":
      return "destructive"
    default:
      return "outline"
  }
}

// Helper function to format date
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date)
}

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string,jobId:string }> }) {

  // Unwrap the params Promise using React.use()
    const { id,jobId } = React.use(params)
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewJobLoading, setViewJobLoading] = useState(false)
  const [browseJobsLoading, setBrowseJobsLoading] = useState(false)

  useEffect(() => {
    async function fetchApplicationDetails() {
      try {
        setLoading(true)
        const response = await fetch(`/api/applications/${id}`)
        const jobResponse = await fetch(`/api/jobs/${jobId}`)
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          if (response.status === 404) {
            router.push("/applications?error=not-found")
            return
          }
          throw new Error("Failed to fetch application details")
        }

        const data = await response.json()
        setApplication(data)
      } catch (error) {
        console.error("Error fetching application details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationDetails()
  }, [id, router])

  const handleViewJob = () => {
    if (!application?.job?.id) return
    setViewJobLoading(true)
    router.push(`/job/${application.job.id}`)
  }

  const handleBrowseJobs = () => {
    setBrowseJobsLoading(true)
    router.push("/jobs")
  }

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/applications" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to applications
          </Link>
          <h1 className="text-3xl font-bold mt-2">Application Details</h1>
          
        </div>
      </div>
    )
  }

  if (!application) return null

  // Check if job exists
  const hasJob = !!application.job
  const hasCompany = hasJob && !!application.job?.company

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/applications" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to applications
        </Link>
        <h1 className="text-3xl font-bold mt-2">Application Details</h1>
      </div>
      <ApplicationInsights jobId={jobId} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasJob ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                      {hasCompany && application.job?.company?.logo ? (
                        <img
                          src={application.job.company.logo || "/placeholder.svg"}
                          alt={application.job.company.name}
                          className="h-10 w-10 rounded-md"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{application.job?.jobTitle}</h2>
                      {hasCompany && (
                        <p className="text-muted-foreground">
                          <Link href={`/companies/${application.job?.company?.id}`} className="hover:underline">
                            {application.job?.company?.name}
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employment Type</p>
                      <p>{application.job?.employmentType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p>{application.job?.location}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" onClick={handleViewJob} disabled={viewJobLoading}>
                      {viewJobLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "View Full Job Posting"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Job information is no longer available. The job posting may have been removed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current status:</span>
                <Badge variant={getStatusBadgeVariant(application.status)}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1).toLowerCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Applied on {formatDate(new Date(application.createdAt))}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last updated on {formatDate(new Date(application.updatedAt))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                {application.status === "PENDING" && "Your application is being reviewed by the employer."}
                {application.status === "REVIEWING" && "The employer is currently reviewing your application."}
                {application.status === "SHORTLISTED" && "Congratulations! You've been shortlisted for this position."}
                {application.status === "REJECTED" &&
                  "Unfortunately, the employer has decided not to move forward with your application."}
              </p>

              {application.status === "SHORTLISTED" && (
                <p className="text-sm">
                  The employer may contact you soon for an interview. Make sure your contact information is up to date.
                </p>
              )}

              {application.status === "REJECTED" && (
                <div className="pt-2">
                  <Button className="w-full" onClick={handleBrowseJobs} disabled={browseJobsLoading}>
                    {browseJobsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Browse More Jobs"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

