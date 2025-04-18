import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { columns, Job } from "./columns"
import { DataTable } from "./data-table"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Jobs | Admin Dashboard",
  description: "Manage job listings in the system",
}

export default async function JobsPage() {
  const session = await auth()
  
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }

  // Fetch jobs with related application count and company name
  const dbJobs = await prisma.jobPost.findMany({
    select: {
      id: true,
      jobTitle: true,
      location: true,
      salaryFrom: true,
      salaryTo: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          JobApplication: true
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Transform data to match expected Job type
  const jobs: Job[] = dbJobs.map(job => ({
    id: job.id,
    title: job.jobTitle,
    companyName: job.company.name,
    companyId: job.company.id,
    location: job.location,
    salary: `$${job.salaryFrom}-$${job.salaryTo}`,
    status: job.status,
    applicationsCount: job._count.JobApplication,
    featured: false, // Default since not in schema
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage job listings and track applications
          </p>
        </div>
        <Link href="/admin/jobs/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </Link>
      </div>
      
      <DataTable columns={columns} data={jobs} />
    </div>
  )
}