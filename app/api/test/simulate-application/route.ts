import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { logger } from "@/app/utils/logger"

export async function POST(req: Request) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== "development" || process.env.ALLOW_TEST_ENDPOINTS !== "true") {
      return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 403 })
    }

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId, companyId, applicantName = "Test Applicant" } = await req.json()

    if (!jobId && !companyId) {
      return NextResponse.json({ error: "Either jobId or companyId is required" }, { status: 400 })
    }

    let targetJobId = jobId
    let targetCompanyId = companyId

    // If only companyId is provided, find a job from that company
    if (!jobId && companyId) {
      const job = await prisma.jobPost.findFirst({
        where: { companyId },
        select: { id: true },
      })

      if (!job) {
        return NextResponse.json({ error: "No jobs found for this company" }, { status: 404 })
      }

      targetJobId = job.id
    }

    // If only jobId is provided, get the companyId
    if (jobId && !companyId) {
      const job = await prisma.jobPost.findUnique({
        where: { id: jobId },
        select: { companyId: true },
      })

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }

      targetCompanyId = job.companyId
    }

    // Create a test notification
    const notification = await prisma.companyNotification.create({
      data: {
        companyId: targetCompanyId,
        jobId: targetJobId,
        type: "NEW_APPLICATION",
        message: `New application received from ${applicantName} for test job`,
        read: false,
      },
    })

    logger.info(`Created test application notification: ${notification.id}`, {
      companyId: targetCompanyId,
      jobId: targetJobId,
    })

    return NextResponse.json({
      success: true,
      notification,
      message: `Created test application notification for company ${targetCompanyId}`,
    })
  } catch (error) {
    logger.error("Error creating test application notification:", error)
    return NextResponse.json({ error: "Failed to create test notification" }, { status: 500 })
  }
}

