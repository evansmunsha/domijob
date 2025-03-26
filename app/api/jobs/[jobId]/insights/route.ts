import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params to get jobId
    const { jobId } = await params

    // Check if the user has applied to this job
    const userApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    })

    // Only show insights to users who have applied
    if (!userApplication) {
      return NextResponse.json({ error: "You must apply to this job to view insights" }, { status: 403 })
    }

    // Get the job seeker's skills
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: { skills: true },
    })

    const userSkills = jobSeeker?.skills || []

    // Get total applicants
    const totalApplicants = await prisma.jobApplication.count({
      where: { jobId },
    })

    // Get applicants with similar skills
    // This is a simplified version - in a real app, you'd need more sophisticated skill matching
    let applicantsWithSimilarSkills = 0
    if (userSkills.length > 0) {
      // Count applicants who have at least one skill in common with the user
      const similarApplicants = await prisma.jobApplication.findMany({
        where: {
          jobId,
          user: {
            JobSeeker: {
              skills: {
                hasSome: userSkills,
              },
            },
          },
        },
        select: { id: true },
      })

      applicantsWithSimilarSkills = similarApplicants.length
    }

    // Calculate skill match percentage
    // This would typically be more sophisticated, comparing user skills to job requirements
    let userSkillMatch = 0
    if (userSkills.length > 0) {
      // Get the job
      const job = await prisma.jobPost.findUnique({
        where: { id: jobId },
        select: { jobTitle: true, jobDescription: true },
      })

      if (job) {
        // Extract potential required skills from job title and description
        const jobText = `${job.jobTitle} ${job.jobDescription}`.toLowerCase()

        // Count how many of the user's skills appear in the job text
        const matchingSkills = userSkills.filter((skill) => jobText.includes(skill.toLowerCase()))

        userSkillMatch = Math.min(100, Math.round((matchingSkills.length / userSkills.length) * 100))
      }
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

    statusCounts.forEach((count) => {
      const status = count.status.toLowerCase()
      if (status in applicationStatus) {
        applicationStatus[status as keyof typeof applicationStatus] = count._count
      }
    })

    // Return the insights data
    return NextResponse.json({
      totalApplicants,
      applicantsWithSimilarSkills,
      userSkillMatch,
      averageExperience: 3, // Placeholder - would need additional data
      applicationStatus,
    })
  } catch (error) {
    console.error("Error fetching application insights:", error)
    return NextResponse.json({ error: "Failed to fetch application insights" }, { status: 500 })
  }
}

