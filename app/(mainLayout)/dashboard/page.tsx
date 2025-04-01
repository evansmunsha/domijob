import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Briefcase, Building2, FileText, Search, User, Clock, CheckCircle, XCircle } from "lucide-react"
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner"
import Image from "next/image"
import type { Prisma } from "@prisma/client"

async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      JobSeeker: true,
    },
  })
}

// Define a proper type for the query object that matches Prisma's expected types
type JobQuery = Prisma.JobPostWhereInput

// Define proper types for the job objects
interface JobWithCompany {
  id: string
  jobTitle: string
  jobDescription: string
  location: string
  employmentType: string
  createdAt: Date
  company: {
    name: string
    logo: string | null
  }
  _count?: {
    JobApplication: number
  }
}

// Update the return type of the getRecommendedJobs function
async function getRecommendedJobs(userId: string): Promise<JobWithCompany[]> {
  // Get the user profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  if (!user) {
    // If no user exists, return recent jobs
    return prisma.jobPost.findMany({
      where: { status: "ACTIVE" },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
  }

  // Get user's job applications to understand preferences
  const userApplications = await prisma.jobApplication.findMany({
    where: { userId },
    include: {
      job: {
        select: {
          id: true,
          jobTitle: true,
          jobDescription: true,
          employmentType: true,
          location: true,
        },
      },
    },
  })

  // Get user's saved jobs
  const savedJobs = await prisma.savedJobPost.findMany({
    where: { userId },
    include: {
      job: {
        select: {
          id: true,
          jobTitle: true,
          jobDescription: true,
          employmentType: true,
          location: true,
        },
      },
    },
  })

  // Extract job types and locations from user behavior
  const appliedJobTypes = new Set<string>()
  const appliedLocations = new Set<string>()
  const userSkills = new Set<string>()

  // Process applied jobs
  userApplications.forEach((app) => {
    if (app.job?.employmentType) {
      appliedJobTypes.add(app.job.employmentType.toLowerCase())
    }
    if (app.job?.location) {
      appliedLocations.add(app.job.location)
    }

    // Extract potential skills from job titles and descriptions
    if (app.job?.jobTitle) {
      extractSkillsFromText(app.job.jobTitle, userSkills)
    }
    if (app.job?.jobDescription) {
      extractSkillsFromText(app.job.jobDescription, userSkills)
    }
  })

  // Process saved jobs
  savedJobs.forEach((saved) => {
    if (saved.job?.employmentType) {
      appliedJobTypes.add(saved.job.employmentType.toLowerCase())
    }
    if (saved.job?.location) {
      appliedLocations.add(saved.job.location)
    }

    // Extract potential skills from job titles and descriptions
    if (saved.job?.jobTitle) {
      extractSkillsFromText(saved.job.jobTitle, userSkills)
    }
    if (saved.job?.jobDescription) {
      extractSkillsFromText(saved.job.jobDescription, userSkills)
    }
  })

  // Build the query based on user behavior
  const query: JobQuery = {
    status: "ACTIVE" as const,
  }

  // Filter by job types if we have data
  if (appliedJobTypes.size > 0) {
    query.employmentType = {
      in: Array.from(appliedJobTypes),
    }
  }

  // Filter by locations if we have data
  if (appliedLocations.size > 0) {
    // Check if any location contains "Remote"
    const hasRemote = Array.from(appliedLocations).some((loc) => loc.toLowerCase().includes("remote"))

    if (hasRemote) {
      // If user has applied to remote jobs, include both remote and specific locations
      query.OR = [{ location: { in: Array.from(appliedLocations) } }, { location: { contains: "Remote" } }]
    } else {
      // Otherwise, just filter by applied locations
      query.location = {
        in: Array.from(appliedLocations),
      }
    }
  }

  // Get jobs matching the criteria
  const matchingJobs = await prisma.jobPost.findMany({
    where: query,
    include: {
      company: {
        select: {
          name: true,
          logo: true,
        },
      },
      _count: {
        select: {
          JobApplication: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20, // Get more than we need for scoring
  })

  // If we have no matching jobs, return recent jobs
  if (matchingJobs.length === 0) {
    return prisma.jobPost.findMany({
      where: { status: "ACTIVE" },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
  }

  // Update the scoredJobs mapping to ensure type safety
  const scoredJobs = matchingJobs.map((job) => {
    // Ensure job has the correct type
    const typedJob = job as unknown as JobWithCompany

    const jobText = `${typedJob.jobTitle} ${typedJob.jobDescription}`.toLowerCase()

    // Base score components
    let skillScore = 0
    let locationScore = 0
    let recencyScore = 0
    let popularityScore = 0

    // 1. Skill match score (0-10)
    if (userSkills.size > 0) {
      skillScore = calculateSkillMatchScore(jobText, Array.from(userSkills))
      // Normalize to 0-10 range
      skillScore = Math.min(10, skillScore * 2)
    }

    // 2. Location match score (0-5)
    if (appliedLocations.size > 0) {
      if (appliedLocations.has(typedJob.location)) {
        locationScore = 5 // Exact match
      } else if (
        typedJob.location.toLowerCase().includes("remote") &&
        Array.from(appliedLocations).some((loc) => loc.toLowerCase().includes("remote"))
      ) {
        locationScore = 4 // Remote match
      }
    } else {
      locationScore = 3 // No preference
    }

    // 3. Recency score (0-5)
    recencyScore = calculateRecencyScore(typedJob.createdAt) * 5

    // 4. Popularity score based on application count (0-3)
    const applicationCount = typedJob._count?.JobApplication || 0
    if (applicationCount > 20) popularityScore = 3
    else if (applicationCount > 10) popularityScore = 2
    else if (applicationCount > 5) popularityScore = 1

    // Calculate weighted total score
    const totalScore =
      skillScore * 0.4 + // 40% weight for skill match
      locationScore * 0.2 + // 20% weight for location match
      recencyScore * 0.3 + // 30% weight for recency
      popularityScore * 0.1 // 10% weight for popularity

    return { job: typedJob, score: totalScore }
  })

  // Sort by score (highest first) and take the top 5
  return scoredJobs
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.job)
}

// Helper function to calculate job recency score
function calculateRecencyScore(jobDate: Date): number {
  const now = new Date()
  const ageInDays = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24)

  // Jobs posted within the last 7 days get the highest score
  if (ageInDays <= 7) return 1.0
  // Jobs posted within the last 30 days get a moderate score
  if (ageInDays <= 30) return 0.8
  // Jobs posted within the last 90 days get a lower score
  if (ageInDays <= 90) return 0.5
  // Older jobs get the lowest score
  return 0.2
}

// Helper function to calculate skill match score
function calculateSkillMatchScore(jobText: string, skills: string[]): number {
  let score = 0
  const jobTextLower = jobText.toLowerCase()

  // Process all skills
  skills.forEach((skill) => {
    const skillLower = skill.toLowerCase()

    // Check if the skill appears in the job text
    if (jobTextLower.includes(skillLower)) {
      score += 1

      // Bonus points for skills in the job title (more prominent placement)
      if (jobTextLower.split(" ").includes(skillLower)) {
        score += 0.5
      }
    }
  })

  return score
}

// Helper function to extract potential skills from text
function extractSkillsFromText(text: string, skillsSet: Set<string>): void {
  // Common tech skills to look for
  const commonSkills = [
    "javascript",
    "typescript",
    "react",
    "node",
    "python",
    "java",
    "c#",
    "c++",
    "html",
    "css",
    "sql",
    "nosql",
    "mongodb",
    "postgresql",
    "mysql",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "devops",
    "ci/cd",
    "git",
    "agile",
    "scrum",
    "product management",
    "ui/ux",
    "design",
    "figma",
    "adobe",
    "marketing",
    "sales",
    "customer service",
    "communication",
    "leadership",
  ]

  const textLower = text.toLowerCase()

  commonSkills.forEach((skill) => {
    if (textLower.includes(skill)) {
      skillsSet.add(skill)
    }
  })

  // Also add job-specific keywords that might be skills
  const words = textLower.split(/\W+/)
  words.forEach((word) => {
    // Only consider words that might be skills (longer than 3 chars, not common words)
    if (word.length > 3 && !commonWords.includes(word)) {
      skillsSet.add(word)
    }
  })
}

// Common words to exclude from skill extraction
const commonWords = [
  "the",
  "and",
  "that",
  "have",
  "for",
  "not",
  "with",
  "you",
  "this",
  "but",
  "his",
  "her",
  "she",
  "they",
  "their",
  "them",
  "some",
  "what",
  "there",
  "about",
  "which",
  "when",
  "your",
  "said",
  "each",
  "will",
  "many",
  "then",
  "these",
  "would",
  "other",
  "into",
  "more",
  "such",
  "time",
  "year",
  "could",
  "also",
  "after",
  "two",
  "most",
  "only",
  "over",
  "very",
  "like",
  "even",
  "back",
  "well",
  "think",
  "should",
  "just",
  "than",
  "where",
  "been",
  "those",
  "must",
  "through",
  "before",
  "same",
  "under",
  "while",
  "against",
  "might",
  "during",
  "without",
  "though",
  "within",
  "both",
  "upon",
  "once",
  "being",
]

// New function to get user's job applications
async function getUserApplications(userId: string) {
  const applications = await prisma.jobApplication.findMany({
    where: { userId },
    include: {
      job: {
        select: {
          id: true,
          jobTitle: true,
          company: {
            select: {
              name: true,
              logo: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  // Filter out any applications where job might be null
  return applications.filter((app) => app.job)
}

// Helper function to get status icon based on application status
function getStatusIcon(status: string) {
  switch (status) {
    case "PENDING":
      return <Clock className="h-4 w-4 text-yellow-500" />
    case "REVIEWING":
      return <Clock className="h-4 w-4 text-blue-500" />
    case "SHORTLISTED":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "REJECTED":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />
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

export default async function Dashboard({ searchParams }: { searchParams: { welcome?: string } }) {
  // Your existing code...

  // Access searchParams directly as it's already resolved
  const showWelcome = searchParams?.welcome === "true"

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [user, recommendedJobs, userApplications] = await Promise.all([
    getUserProfile(session.user.id),
    getRecommendedJobs(session.user.id),
    getUserApplications(session.user.id),
  ])

  const isJobSeeker = user?.userType === "JOB_SEEKER"

  if (!user?.onboardingCompleted) {
    redirect("/onboarding")
  }

  return (
    <div className="container py-8 max-w-7xl">
      {showWelcome && (
        <WelcomeBanner
          name={isJobSeeker ? user.JobSeeker?.name || user.name || "there" : user.name || "there"}
          userType={user.userType}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          {isJobSeeker && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Jobs</CardTitle>
                  <CardDescription>Jobs that match your profile and interests</CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendedJobs.length > 0 ? (
                    <div className="space-y-4">
                      {recommendedJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                            {job.company.logo ? (
                              <Image
                                src={job.company.logo || "/placeholder.svg"}
                                alt={job.company.name}
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
                              <Link href={`/job/${job.id}`} className="hover:underline">
                                {job.jobTitle}
                              </Link>
                            </h3>
                            <p className="text-sm text-muted-foreground">{job.company.name}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">{job.employmentType}</Badge>
                              <Badge variant="outline">{job.location}</Badge>
                              {job.createdAt &&
                                new Date(job.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                                  <Badge variant="default" className="bg-green-500">
                                    New
                                  </Badge>
                                )}
                            </div>
                          </div>
                          <Button asChild size="sm">
                            <Link href={`/job/${job.id}`}>View Job</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No recommended jobs yet</h3>
                      <p className="text-muted-foreground mb-4">
                        We&apos;ll show personalized job recommendations here as they become available
                      </p>
                      <Button asChild>
                        <Link href="/job">Browse All Jobs</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Applications</CardTitle>
                  <CardDescription>Track the status of your job applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {userApplications.length > 0 ? (
                    <div className="space-y-4">
                      {userApplications.map((application) => (
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
                              <Link href={`/job/${application.job?.id || "#"}`} className="hover:underline">
                                {application.job?.jobTitle || "Unknown Job"}
                              </Link>
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {application.job?.company?.name || "Unknown Company"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center">
                                {getStatusIcon(application.status)}
                                <span className="text-sm ml-1">
                                  {application.status.charAt(0).toUpperCase() +
                                    application.status.slice(1).toLowerCase()}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Applied on {formatDate(application.createdAt)}
                              </span>
                            </div>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/applications/${application.id}`}>View Details</Link>
                          </Button>
                        </div>
                      ))}

                      {userApplications.length > 4 && (
                        <div className="text-center pt-2">
                          <Button asChild variant="link">
                            <Link href={`/applications`}>View All Applications</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No applications yet</h3>
                      <p className="text-muted-foreground mb-4">
                        When you apply for jobs, they&apos;ll appear here so you can track their status
                      </p>
                      <Button asChild>
                        <Link href="/job">Find Jobs to Apply</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Manage your job seeker profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{user.JobSeeker?.name || user.name}</h3>
                    <p className="text-sm text-muted-foreground">Job Seeker</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profile Completion</span>
                    <span className="text-sm font-medium">80%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  {user.JobSeeker?.resume && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Resume uploaded</span>
                    </div>
                  )}

                  <Button asChild variant="outline" className="w-full">
                    <Link href="/profile">Edit Profile</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/job">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Jobs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/saved-jobs">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Saved Jobs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/companies">
                    <Building2 className="h-4 w-4 mr-2" />
                    Browse Companies
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

