import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { logger } from "@/app/utils/logger"

// Import the notification utility
import { notifyCompanyOfNewApplication } from "@/app/utils/notifications"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    logger.info(`User ${session.user.id} applying to job ${jobId}`)

    // Check if the job exists
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { company: true },
    })

    if (!job) {
      logger.error(`Job not found: ${jobId}`)
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if the user has already applied to this job
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    })

    if (existingApplication) {
      logger.info(`User ${session.user.id} has already applied to job ${jobId}`)
      return NextResponse.json({ error: "You have already applied to this job" }, { status: 400 })
    }

    // Create the application
    const application = await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        jobId,
        status: "PENDING",
      },
    })

    logger.info(`Application created: ${application.id}`)

    // Get the job seeker's name
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: { name: true },
    })

    // Replace the notification creation code with the utility function
    // Find the section where you create notifications for new applications and replace with:
    try {
      const applicantName = jobSeeker?.name || "A candidate"
      await notifyCompanyOfNewApplication(job.companyId, jobId, job.jobTitle, applicantName)
    } catch (notificationError) {
      // Log the error but don't fail the application
      logger.error("Error creating company notification:", notificationError)
    }

    return NextResponse.json(application)
  } catch (error) {
    logger.error("Error creating application:", error)
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 })
  }
}

