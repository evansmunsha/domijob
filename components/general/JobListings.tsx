import { prisma } from "@/app/utils/db"
import { EmptyState } from "./EmptyState"
import { PaginationComponent } from "./PaginationComponent"
import { JobPostStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { JobCard } from "./JobCard"

async function getJobs(page = 1, pageSize = 20, jobTypes: string[] = [], location = "") {
  const skip = (page - 1) * pageSize

  const where = {
    status: JobPostStatus.ACTIVE,
    ...(jobTypes.length > 0 && {
      employmentType: {
        in: jobTypes,
      },
    }),
    ...(location &&
      location !== "worldwide" && {
        location: location,
      }),
  }

  const [data, totalCount] = await Promise?.all([
    prisma?.jobPost?.findMany({
      skip,
      take: pageSize,
      where,
      select: {
        jobTitle: true,
        id: true,
        salaryFrom: true,
        salaryTo: true,
        employmentType: true,
        location: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
            about: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.jobPost.count({ where }),
  ])

  return {
    jobs: data,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  }
}

export default async function JobListings({
  currentPage,
  jobTypes,
  location,
}: {
  currentPage: number
  jobTypes: string[]
  location: string
}) {
  const { jobs, totalPages, currentPage: page } = await getJobs(currentPage, 20, jobTypes, location)

  return (
    <>
      {jobs.length > 0 ? (
        <div className="flex flex-col w-full">
          {/* Header section with action buttons */}
          <div className="bg-red-500 text-white rounded-t-lg p-4 flex justify-between items-center">
            <h2 className="font-bold text-lg">Remote Jobs</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="text-xs">
                Post a Job
              </Button>
              <Button size="sm" variant="secondary" className="text-xs">
                Create Alert
              </Button>
              <Button size="sm" variant="secondary" className="text-xs">
                RSS
              </Button>
            </div>
          </div>

          {/* Job listings */}
          <div className="border border-gray-200 rounded-b-lg overflow-hidden">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} isHighlighted={index % 5 === 0} />
            ))}
          </div>

          {/* Footer section with action buttons */}
          <div className="bg-red-500 text-white rounded-b-lg p-4 flex justify-between items-center mt-4">
            <h2 className="font-bold text-lg">Remote Jobs</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="text-xs">
                Post a Job
              </Button>
              <Button size="sm" variant="secondary" className="text-xs">
                Create Alert
              </Button>
              <Button size="sm" variant="secondary" className="text-xs">
                RSS
              </Button>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <PaginationComponent totalPages={totalPages} currentPage={page} />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No jobs found"
          description="Try searching for a different job title or location."
          buttonText="Clear all filters"
          href="/"
        />
      )}
    </>
  )
}
