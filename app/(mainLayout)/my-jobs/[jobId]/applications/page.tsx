import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Mail, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { EmptyState } from "@/components/general/EmptyState"
import { prisma } from "@/app/utils/db"
import { requireUser } from "@/app/utils/hooks"
import { use } from "react"

// Helper function to format relative time without date-fns
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`
}

async function getJobWithApplications(jobId: string, userId: string | undefined) {
  if (!userId) {
    return null
  }

  try {
    // First verify the job belongs to the user's company
    const job = await prisma.jobPost.findFirst({
      where: {
        id: jobId,
        company: {
          userId: userId,
        },
      },
      select: {
        id: true,
        jobTitle: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!job) {
      return null
    }

    // Then get all applications for this job
    const applications = await prisma.jobApplication.findMany({
      where: {
        jobId: jobId,
      },
      select: {
        id: true,
        createdAt: true,
        appliedVia: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Mark any unread notifications as read
    await prisma.companyNotification.updateMany({
      where: {
        companyId: job.company.id,
        jobId: jobId,
        type: "NEW_APPLICATION",
        read: false,
      },
      data: {
        read: true,
      },
    })

    return {
      job,
      applications,
    }
  } catch (error) {
    console.error("Error fetching job with applications:", error)
    return null
  }
}

export default function JobApplicationsPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const { jobId } = resolvedParams

  // Use the use() hook to handle async functions
  const session = use(requireUser())
  const data = use(getJobWithApplications(jobId, session.id))

  if (!data) {
    notFound()
  }

  const { job, applications } = data

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Applications for {job.jobTitle}</h1>
        <p className="text-muted-foreground">Review and manage applications for this position</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="When candidates apply for this job, they'll appear here."
          icon={<User className="h-10 w-10" />}
          buttonText="View job post"
          href={`/job/${job.id}`}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Applications ({applications.length})</CardTitle>
            <CardDescription>Manage applications for {job.jobTitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={application.user.image || ""} alt={application.user.name || ""} />
                          <AvatarFallback>{application.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <span>{application.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{application.user.email}</TableCell>
                    <TableCell>{formatRelativeTime(application.createdAt)}</TableCell>
                    <TableCell>{application.appliedVia}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          application.status === "PENDING"
                            ? "outline"
                            : application.status === "REVIEWING"
                              ? "secondary"
                              : application.status === "REJECTED"
                                ? "destructive"
                                : "default"
                        }
                      >
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${jobId}/applications/${application.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${application.user.email}?subject=Your application for ${job.jobTitle}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Contact Applicant
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}

