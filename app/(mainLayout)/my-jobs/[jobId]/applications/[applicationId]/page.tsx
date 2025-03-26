import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/app/utils/db"
import { requireUser } from "@/app/utils/hooks"
import { updateApplicationStatus } from "@/app/actions"

// Helper function to format date without date-fns
function formatDate(date: Date, formatString: string): string {
  const options: Intl.DateTimeFormatOptions = {}

  if (formatString.includes("MMMM")) options.month = "long"
  else if (formatString.includes("MMM")) options.month = "short"
  else if (formatString.includes("MM")) options.month = "2-digit"

  if (formatString.includes("d")) options.day = "numeric"
  if (formatString.includes("yyyy")) options.year = "numeric"

  if (formatString.includes("h")) {
    options.hour = "numeric"
    options.hour12 = true
  }

  if (formatString.includes("mm")) options.minute = "2-digit"

  if (formatString.includes("a")) options.hour12 = true

  return new Intl.DateTimeFormat("en-US", options).format(date)
}

async function getApplicationDetails(applicationId: string, userId: string) {
  try {
    // Verify the application belongs to the user's company
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: {
          company: {
            userId: userId,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        job: {
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
        },
      },
    })

    return application
  } catch (error) {
    console.error("Error fetching application details:", error)
    return null
  }
}

export default async function ApplicationDetailsPage({
  params,
}: {
  params: { jobId: string; applicationId: string }
}) {
  const { applicationId, jobId } = params
  const session = await requireUser()
  const application = await getApplicationDetails(applicationId, session.id as string)

  if (!application) {
    notFound()
  }

  // Create bound versions of the updateApplicationStatus function
  const markAsReviewing = updateApplicationStatus.bind(null, application.id, "REVIEWING")
  const markAsShortlisted = updateApplicationStatus.bind(null, application.id, "SHORTLISTED")
  const markAsRejected = updateApplicationStatus.bind(null, application.id, "REJECTED")

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/my-jobs/${jobId}/applications`}
          className="flex items-center text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to applications
        </Link>
        <h1 className="text-2xl font-bold">Application from {application.user.name}</h1>
        <p className="text-muted-foreground">For the position of {application.job.jobTitle}</p>
      </div>

      <div className="grid md:grid-cols-[2fr,1fr] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={application.user.image || ""} alt={application.user.name || ""} />
                  <AvatarFallback className="text-lg">
                    {application.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{application.user.name}</h3>
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4" />
                    {application.user.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Member since</p>
                  <p className="font-medium">{formatDate(application.user.createdAt, "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied via</p>
                  <p className="font-medium">{application.appliedVia}</p>
                </div>
              </div>
            </CardContent>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href={`mailto:${application.user.email}?subject=Your application for ${application.job.jobTitle}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Applicant
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Additional sections could go here - resume, cover letter, etc. */}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Update the status of this application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current status:</span>
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
                </div>
                <p className="text-sm text-muted-foreground">
                  Applied on {formatDate(application.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </CardContent>
            <CardContent className="flex flex-col space-y-2">
              <form action={markAsReviewing} className="w-full">
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={application.status === "REVIEWING"}
                >
                  Mark as Reviewing
                </Button>
              </form>
              <form action={markAsShortlisted} className="w-full">
                <Button type="submit" className="w-full" disabled={application.status === "SHORTLISTED"}>
                  Shortlist Candidate
                </Button>
              </form>
              <form action={markAsRejected} className="w-full">
                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full"
                  disabled={application.status === "REJECTED"}
                >
                  Reject Application
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{application.job.jobTitle}</p>
                <p className="text-sm text-muted-foreground">{application.job.company.name}</p>
              </div>
            </CardContent>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/job/${application.job.id}`}>View Job Post</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

