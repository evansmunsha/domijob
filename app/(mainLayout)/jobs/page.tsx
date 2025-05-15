import { prisma } from "@/app/utils/db"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import { Building2, MapPin, Clock, Search } from "lucide-react"
import Image from "next/image"
import { formatRelativeTime } from "@/app/utils/formatRelativeTime"
import { formatCurrency } from "@/app/utils/formatCurrency"

export const metadata: Metadata = {
  title: "Browse Jobs | DoMiJob",
  description: "Find your next remote job opportunity with top companies worldwide",
}

async function getJobs(params: {
  companyId?: string
  search?: string
  jobTypes?: string[]
  location?: string
  sortBy?: string
}) {
  const { companyId, search, jobTypes, location, sortBy } = params

  // Build the where clause for the query
  const where: any = {
    status: "ACTIVE",
    ...(companyId ? { companyId } : {}),
  }

  // Add search filter if provided
  if (search) {
    where.OR = [
      { jobTitle: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  // Add job types filter if provided
  if (jobTypes && jobTypes.length > 0) {
    where.employmentType = { in: jobTypes }
  }

  // Add location filter if provided
  if (location && location !== "worldwide" && location !== "any") {
    where.location = { contains: location, mode: "insensitive" }
  }

  // Determine the sort order
  let orderBy: any = { createdAt: "desc" }
  if (sortBy === "salary-high") {
    orderBy = { salaryTo: "desc" }
  } else if (sortBy === "salary-low") {
    orderBy = { salaryFrom: "asc" }
  } else if (sortBy === "newest") {
    orderBy = { createdAt: "desc" }
  } else if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" }
  }

  try {
    const jobs = await prisma.jobPost.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy,
    })

    return jobs
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return []
  }
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: {
    company?: string
    search?: string
    jobTypes?: string
    location?: string
    sortBy?: string
  }
}) {
  // Parse search parameters
  const companyId = searchParams.company
  const search = searchParams.search || ""
  const jobTypes = searchParams.jobTypes ? searchParams.jobTypes.split(",") : []
  const location = searchParams.location || ""
  const sortBy = searchParams.sortBy || "newest"

  // Fetch jobs with filters
  const jobs = await getJobs({
    companyId,
    search,
    jobTypes,
    location,
    sortBy,
  })

  // Format salary range
  const formatSalary = (from?: number | null, to?: number | null) => {
    if (!from && !to) return "Salary not specified"
    if (from && !to) return `${formatCurrency(from)}+`
    if (!from && to) return `Up to ${formatCurrency(to)}`
    return `${formatCurrency(from)} - ${formatCurrency(to)}`
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Job listings */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-primary/5 hover:border-primary/50 bg-white dark:bg-black/60"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                    <Image
                      src={job.company.logo || `https://avatar.vercel.sh/${job.company.name}`}
                      alt={job.company.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/job/${job.id}`} className="hover:text-primary transition-colors">
                        {job.jobTitle}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Building2 className="h-3.5 w-3.5 mr-1.5" />
                      {job.company.name}
                    </p>
                  </div>
                </div>
                <Badge variant={job.employmentType === "full-time" ? "default" : "outline"} className="ml-2">
                  {job.employmentType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  <span>{job.location || "Remote"}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>{formatRelativeTime(job.createdAt)}</span>
                </div>
                {(job.salaryFrom || job.salaryTo) && (
                  <p className="text-sm font-medium mt-1">{formatSalary(job.salaryFrom, job.salaryTo)}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild className="w-full">
                <Link href={`/job/${job.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card className="p-12 text-center bg-muted/30">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We couldn't find any jobs matching your criteria. Try adjusting your filters or check back later.
          </p>
          <Button asChild variant="outline">
            <Link href="/jobs">View All Jobs</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
