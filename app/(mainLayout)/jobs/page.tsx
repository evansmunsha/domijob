import { prisma } from "@/app/utils/db"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { use } from "react"
import type { Metadata } from "next"
import { Building2, MapPin, Clock, Briefcase, Search, Filter, ArrowUpDown } from "lucide-react"
import Image from "next/image"
import { formatRelativeTime } from "@/app/utils/formatRelativeTime"
import { formatCurrency } from "@/app/utils/formatCurrency"

export const metadata: Metadata = {
  title: "Browse Jobs | DoMiJob",
  description: "Find your next remote job opportunity with top companies worldwide",
}

async function getJobs(companyId?: string) {
  return prisma.jobPost.findMany({
    where: {
      status: "ACTIVE",
      ...(companyId ? { companyId } : {}),
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export default function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  // Unwrap the searchParams Promise using React.use()
  const resolvedSearchParams = use(searchParams)
  const companyId = resolvedSearchParams.company

  // Use the use() hook to handle the async getJobs function
  const jobs = use(getJobs(companyId))

  // Format salary range
  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return "Salary not specified"
    if (from && !to) return formatCurrency(from) + "+"
    if (!from && to) return "Up to " + formatCurrency(to)
    return `${formatCurrency(from)} - ${formatCurrency(to)}`
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Hero section with gradient background */}
      <div className="relative mb-8 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/50 dark:from-primary/70 dark:to-primary/40"></div>
        <div className="relative z-10 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {companyId ? `Jobs at ${jobs[0]?.company.name}` : "Discover Your Next Opportunity"}
          </h1>
          <p className="text-white/90 max-w-2xl mb-6">
            Browse through our curated list of remote jobs from top companies worldwide. Find the perfect role that
            matches your skills and aspirations.
          </p>

          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
              <input
                type="text"
                placeholder="Search jobs by title or keyword..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <Button variant="secondary" className="h-10 gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            <Button variant="secondary" className="h-10 gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort</span>
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>
            <Briefcase className="h-8 w-8 text-primary/60" />
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Remote Jobs</p>
              <p className="text-2xl font-bold">
                {jobs.filter((job) => job.location?.toLowerCase().includes("remote")).length}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-primary/60" />
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Companies</p>
              <p className="text-2xl font-bold">{new Set(jobs.map((job) => job.company.id)).size}</p>
            </div>
            <Building2 className="h-8 w-8 text-primary/60" />
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Today</p>
              <p className="text-2xl font-bold">
                {
                  jobs.filter((job) => {
                    const today = new Date()
                    const jobDate = new Date(job.createdAt)
                    return today.toDateString() === jobDate.toDateString()
                  }).length
                }
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary/60" />
          </CardContent>
        </Card>
      </div>

      {/* Job listings */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-primary/5 hover:border-primary/50"
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

      {/* Call to action */}
      <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Are you a recruiter?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          Post your job openings on DoMiJob and reach thousands of qualified candidates. Our AI-powered platform helps
          you find the perfect match for your team.
        </p>
        <Button asChild size="lg">
          <Link href="/post-job">Post a Job</Link>
        </Button>
      </div>
    </div>
  )
}
