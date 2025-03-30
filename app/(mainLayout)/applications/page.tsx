"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Building2, Clock, CheckCircle, XCircle, Briefcase, Loader2 } from "lucide-react"
import Image from "next/image"

// Define proper types for the application data
interface Company {
  id: string
  name: string
  logo: string | null
}

interface Job {
  id: string
  jobTitle: string
  company?: Company
}

interface Application {
  id: string
  status: string
  createdAt: string
  job?: Job
}

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

// Helper function to get status icon based on application status
function getStatusIcon(status: string) {
  switch (status) {
    case "PENDING":
      return <Clock className="h-4 w-4" />
    case "REVIEWING":
      return <Clock className="h-4 w-4" />
    case "SHORTLISTED":
      return <CheckCircle className="h-4 w-4" />
    case "REJECTED":
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

// Helper function to format date
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDetailsLoading, setViewDetailsLoading] = useState<string | null>(null)
  const [viewJobLoading, setViewJobLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true)
        const response = await fetch("/api/applications")

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch applications")
        }

        const data = await response.json()
        setApplications(data)
      } catch (error) {
        console.error("Error fetching applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [router])

  const handleViewDetails = (id: string) => {
    setViewDetailsLoading(id)
    router.push(`/applications/${id}`)
  }

  const handleViewJob = (id: string) => {
    setViewJobLoading(id)
    router.push(`/jobs/${id}`)
  }

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Your Applications</h1>
        <Card>
          <CardContent className="p-6 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Your Applications</h1>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven&apos;t applied to any jobs yet. Browse available jobs and start applying!
          </p>
          <Button asChild>
            <Link href="/jobs">Browse Jobs</Link>
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Applications ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                    {application.job?.company?.logo ? (
                      <Image
                        src={application.job.company.logo || "/placeholder.svg"}
                        alt={application.job.company.name}
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
                      {application.job ? (
                        <Link href={`/jobs/${application.job.id}`} className="hover:underline">
                          {application.job.jobTitle}
                        </Link>
                      ) : (
                        "Job no longer available"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {application.job?.company ? (
                        <Link href={`/companies/${application.job.company.id}`} className="hover:underline">
                          {application.job.company.name}
                        </Link>
                      ) : (
                        "Company information unavailable"
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <Badge variant={getStatusBadgeVariant(application.status)} className="flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1).toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Applied on {formatDate(new Date(application.createdAt))}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(application.id)}
                      disabled={viewDetailsLoading === application.id}
                    >
                      {viewDetailsLoading === application.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "View Details"
                      )}
                    </Button>
                    {application.job && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewJob(application.job.id)}
                        disabled={viewJobLoading === application.job.id}
                      >
                        {viewJobLoading === application.job.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "View Job"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

