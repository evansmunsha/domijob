import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { logger } from "@/app/utils/logger"
import { notifyCompanyOfProfileView, notifyCompanyOfPotentialCandidate } from "@/app/utils/notifications"

// Calculate match percentage between job seeker skills and job requirements
function calculateMatchScore(jobSeekerSkills: string[], jobText: string): number {
  if (!jobSeekerSkills.length) return 0

  let matchCount = 0
  jobSeekerSkills.forEach((skill) => {
    if (jobText.toLowerCase().includes(skill.toLowerCase())) {
      matchCount++
    }
  })

  return Math.round((matchCount / jobSeekerSkills.length) * 100)
}

export async function POST(req: Request) {
  try {
    const { companyId } = await req.json()

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Check if the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Get the current user (optional - they might not be logged in)
    const session = await auth()
    const userId = session?.user?.id

    // Get user location from headers if available
    const userLocation = req.headers.get("x-vercel-ip-country") || "Unknown"

    logger.info(`Recording profile view for company ${companyId}`, {
      userId: userId || "anonymous",
      location: userLocation,
    })

    // Record the profile view
    const profileView = await prisma.companyProfileView.create({
      data: {
        companyId,
        userId: userId || undefined,
        timestamp: new Date(),
        location: userLocation,
      },
    })

    logger.debug(`Profile view recorded: ${profileView.id}`)

    // Create a notification for the company if this is a significant event
    // For example, if this is the 10th view today or if a job seeker with matching skills viewed the profile
    const viewsToday = await prisma.companyProfileView.count({
      where: {
        companyId,
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })

    if (viewsToday === 10 || viewsToday === 50 || viewsToday === 100) {
      await notifyCompanyOfProfileView(companyId, viewsToday, userLocation)
    }

    // Check for views from new regions
    const existingLocations = await prisma.companyProfileView.groupBy({
      by: ["location"],
      where: {
        companyId,
        timestamp: {
          lt: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })

    const isNewRegion = !existingLocations.find((l) => l.location === userLocation)

    if (isNewRegion && userLocation !== "Unknown") {
      await prisma.companyNotification.create({
        data: {
          companyId,
          type: "NEW_REGION",
          message: `Your profile was viewed from ${userLocation} for the first time!`,
          read: false,
        },
      })
    }

    // If the viewer is a job seeker with relevant skills, notify the company
    if (userId) {
      const jobSeeker = await prisma.jobSeeker.findUnique({
        where: { userId },
        select: { skills: true, name: true },
      })

      if (jobSeeker && jobSeeker.skills && jobSeeker.skills.length > 0) {
        // Check if this job seeker has skills that match the company's job requirements
        const companyJobs = await prisma.jobPost.findMany({
          where: {
            companyId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            jobTitle: true,
            jobDescription: true,
          },
        })

        const jobTexts = companyJobs
          .map((job) => `${job.jobTitle} ${job.jobDescription}`)
          .join(" ")
          .toLowerCase()

        // Calculate match score
        const matchScore = calculateMatchScore(jobSeeker.skills, jobTexts)

        // Find the best matching job
        let bestMatchingJob = null
        let highestScore = 0

        for (const job of companyJobs) {
          const jobText = `${job.jobTitle} ${job.jobDescription}`.toLowerCase()
          const score = calculateMatchScore(jobSeeker.skills, jobText)

          if (score > highestScore) {
            highestScore = score
            bestMatchingJob = job
          }
        }

        logger.debug(`Job seeker ${userId} has a ${matchScore}% match with company ${companyId}`)

        if (matchScore > 50) {
          await notifyCompanyOfPotentialCandidate(
            companyId,
            bestMatchingJob?.id,
            matchScore,
            jobSeeker.skills,
            jobSeeker.name || "Anonymous",
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error recording profile view:", error)
    return NextResponse.json({ error: "Failed to record profile view" }, { status: 500 })
  }
}

