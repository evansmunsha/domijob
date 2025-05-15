import { prisma } from "@/app/utils/db"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import { Building2, MapPin, Clock, Briefcase, Search } from "lucide-react"
import Image from "next/image"
import { formatRelativeTime } from "@/app/utils/formatRelativeTime"
import { formatCurrency } from "@/app/utils/formatCurrency"
import { JobSearch } from "@/components/jobs/JobSearch"

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

  // Count remote jobs
  const remoteJobsCount = jobs.filter(
    (job) => job.location?.toLowerCase().includes("remote") || job.location?.toLowerCase().includes("anywhere"),
  ).length

  // Count companies
  const companiesCount = new Set(jobs.map((job) => job.company.id)).size

  // Count jobs posted today
  const today = new Date()
  const todayJobsCount = jobs.filter((job) => {
    const jobDate = new Date(job.createdAt)
    return today.toDateString() === jobDate.toDateString()
  }).length

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Hero section with gradient background */}
      <div className="relative mb-8 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 dark:from-green-800 dark:to-green-700"></div>
        <div className="relative z-10 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {companyId ? `Jobs at ${jobs[0]?.company.name || "Company"}` : "Discover Your Next Opportunity"}
          </h1>
          <p className="text-white/90 max-w-2xl mb-6">
            Browse through our curated list of remote jobs from top companies worldwide. Find the perfect role that
            matches your skills and aspirations.
          </p>

          {/* Search and filter bar - Now functional */}
          <JobSearch
            initialSearch={search}
            initialJobTypes={jobTypes}
            initialLocation={location}
            initialSortBy={sortBy}
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-black/80 border-green-900/30 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Jobs</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-800/30 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-green-900/30 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Remote Jobs</p>
              <p className="text-2xl font-bold">{remoteJobsCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-800/30 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-green-900/30 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Companies</p>
              <p className="text-2xl font-bold">{companiesCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-800/30 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-green-900/30 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">New Today</p>
              <p className="text-2xl font-bold">{todayJobsCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-800/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job listings */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-green-900/10 hover:border-green-600/30 bg-white dark:bg-black/60"
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
                      <Link href={`/job/${job.id}`} className="hover:text-green-600 transition-colors">
                        {job.jobTitle}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Building2 className="h-3.5 w-3.5 mr-1.5" />
                      {job.company.name}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={job.employmentType === "full-time" ? "default" : "outline"}
                  className={job.employmentType === "full-time" ? "bg-green-600 hover:bg-green-700" : ""}
                >
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
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href={`/job/${job.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card className="p-12 text-center bg-black/60 border-green-900/30 text-white">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-green-900/20 flex items-center justify-center">
            <Search className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            We couldn't find any jobs matching your criteria. Try adjusting your filters or check back later.
          </p>
          <Button asChild variant="outline" className="border-green-600 text-green-500 hover:bg-green-900/20">
            <Link href="/jobs">View All Jobs</Link>
          </Button>
        </Card>
      )}

      {/* Call to action */}
      <div className="mt-16 bg-gradient-to-r from-green-900/30 to-green-800/20 rounded-xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Are you a recruiter?</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Post your job openings on DoMiJob and reach thousands of qualified candidates. Our AI-powered platform helps
          you find the perfect match for your team.
        </p>
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
          <Link href="/post-job">Post a Job</Link>
        </Button>
      </div>
    </div>
  )
}
