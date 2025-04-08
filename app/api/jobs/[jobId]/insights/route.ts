import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request, context: { params: { jobId: string } }) {
  try {
    const session = await auth()
    console.log(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = context.params

    // Check if the job exists
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        company: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if the user has applied for this job
    const hasApplied = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    })

    // If the user is not the company owner and hasn't applied, they can't see insights
    const isCompanyOwner = job.company.userId === session.user.id

    if (!isCompanyOwner && !hasApplied) {
      return NextResponse.json({ error: "You must apply to this job to view insights" }, { status: 403 })
    }

    // Get total applications count
    const totalApplicants = await prisma.jobApplication.count({
      where: { jobId },
    })

    // Get the user's skills if they're a job seeker
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: { skills: true },
    })

    const userSkills = jobSeeker?.skills || []

    // Count applicants with similar skills
    let applicantsWithSimilarSkills = 0
    let userSkillMatch = 0

    if (userSkills.length > 0) {
      // Get all applicants with their skills
      const applicantsWithSkills = await prisma.jobApplication.findMany({
        where: { jobId },
        include: {
          user: {
            include: {
              JobSeeker: {
                select: { skills: true },
              },
            },
          },
        },
      })

      // Count applicants with at least one matching skill
      applicantsWithSimilarSkills = applicantsWithSkills.filter((app) => {
        const appSkills = app.user.JobSeeker?.skills || []
        return appSkills.some((skill) => userSkills.includes(skill))
      }).length

      // Calculate user's skill match percentage
      // This is a simplified calculation - in a real app, you might want to compare against job requirements
      const jobDescription = job.jobDescription.toLowerCase()
      const matchingSkills = userSkills.filter((skill) => jobDescription.includes(skill.toLowerCase()))

      userSkillMatch = userSkills.length > 0 ? Math.round((matchingSkills.length / userSkills.length) * 100) : 0
    }

    // Get application status breakdown
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ["status"],
      where: { jobId },
      _count: true,
    })

    const applicationStatus = {
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
    }

    statusCounts.forEach((status) => {
      const statusKey = status.status.toLowerCase()
      if (statusKey in applicationStatus) {
        applicationStatus[statusKey as keyof typeof applicationStatus] = status._count
      }
    })

    // Calculate average experience (placeholder - would need a field for this)
    const averageExperience = 3

    return NextResponse.json({
      totalApplicants,
      applicantsWithSimilarSkills,
      userSkillMatch,
      averageExperience,
      applicationStatus,
    })
  } catch (error) {
    console.error("Error fetching job insights:", error)
    return NextResponse.json({ error: "Failed to fetch job insights" }, { status: 500 })
  }
}

