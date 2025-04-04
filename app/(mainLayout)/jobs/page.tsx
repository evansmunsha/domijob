import { prisma } from "@/app/utils/db"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { use } from "react"

async function getJobs(companyId?: string) {
  return prisma.jobPost.findMany({
    where: {
      status: "ACTIVE",
      ...(companyId ? { companyId } : {}),
    },
    include: {
      company: {
        select: {
          name: true,
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{companyId ? `Jobs at ${jobs[0]?.company.name}` : "All Jobs"}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/job/${job.id}`} className="hover:underline">
                  {job.jobTitle}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{job.company.name}</p>
              <div className="flex flex-wrap gap-2">
                <Badge>{job.employmentType}</Badge>
                <Badge variant="outline">{job.location}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {jobs.length === 0 && <p className="text-center text-muted-foreground p-4">No jobs found.</p>}
    </div>
  )
}

