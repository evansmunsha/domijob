import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateApplicationStatus } from "@/app/actions"
import { requireUser } from "@/app/utils/hooks"
import { prisma } from "@/app/utils/db"
import { use } from "react"

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
  }).format(date)
}

async function getApplicationDetails(jobId: string, applicationId: string, userId: string | undefined) {
  if (!userId) {
    return null
  }

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job: {
        id: jobId,
        company: {
          userId,
        },
      },
    },
    include: {
      job: true,
      user: {
        include: {
          JobSeeker: true,
        },
      },
    },
  })

  if (!application) {
    return null
  }

  return application
}

export default function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ jobId: string; applicationId: string }>
}) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const { jobId, applicationId } = resolvedParams

  // Use the use() hook to handle async functions
  const user = use(requireUser())

  // Check if user.id exists
  if (!user.id) {
    notFound()
  }

  const application = use(getApplicationDetails(jobId, applicationId, user.id))

  if (!application) {
    notFound()
  }

  const jobSeeker = application.user.JobSeeker

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Application Details</h1>
        <Badge variant={getStatusBadgeVariant(application.status)}>
          {application.status.charAt(0).toUpperCase() + application.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={application.user.image || `https://avatar.vercel.sh/${jobSeeker?.name}`}
                    alt={jobSeeker?.name || "Applicant"}
                  />
                  <AvatarFallback>
                    {jobSeeker?.name?.charAt(0).toUpperCase() || application.user.email?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{jobSeeker?.name || "Applicant"}</h2>
                  <p className="text-muted-foreground">{application.user.email}</p>
                </div>
              </div>

              <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="resume">Resume</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">About</h3>
                      <p className="text-muted-foreground">{jobSeeker?.about || "No information provided"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Applied on</h3>
                      <p className="text-muted-foreground">{formatDate(application.createdAt)}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Skills</h3>
                      {jobSeeker?.skills && jobSeeker.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {jobSeeker.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No skills listed</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Languages</h3>
                      {jobSeeker?.languages && jobSeeker.languages.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {jobSeeker.languages.map((language, index) => (
                            <Badge key={index} variant="outline">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No languages listed</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resume" className="mt-4">
                  <div className="space-y-4">
                    {jobSeeker?.resume ? (
                      <div>
                        <h3 className="font-medium mb-2">Resume</h3>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline">
                            <a href={jobSeeker.resume} target="_blank" rel="noopener noreferrer">
                              View Resume
                            </a>
                          </Button>
                          <Button asChild variant="outline">
                            <a href={jobSeeker.resume} download>
                              Download Resume
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No resume uploaded</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Current Status</h3>
                  <Badge variant={getStatusBadgeVariant(application.status)} className="w-full justify-center py-1">
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1).toLowerCase()}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Update Status</h3>
                  <form className="space-y-2">
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      formAction={async () => {
                        "use server"
                        await updateApplicationStatus(application.id, "REVIEWING")
                      }}
                      disabled={application.status === "REVIEWING"}
                    >
                      Mark as Reviewing
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      formAction={async () => {
                        "use server"
                        await updateApplicationStatus(application.id, "SHORTLISTED")
                      }}
                      disabled={application.status === "SHORTLISTED"}
                    >
                      Shortlist Candidate
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      className="w-full"
                      formAction={async () => {
                        "use server"
                        await updateApplicationStatus(application.id, "REJECTED")
                      }}
                      disabled={application.status === "REJECTED"}
                    >
                      Reject Application
                    </Button>
                  </form>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Application Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Applied</span>
                      <span className="text-muted-foreground">{formatDate(application.createdAt)}</span>
                    </div>
                    {application.status !== "PENDING" && (
                      <div className="flex justify-between">
                        <span>Status Updated</span>
                        <span className="text-muted-foreground">{formatDate(application.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

