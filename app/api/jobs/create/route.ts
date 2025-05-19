import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { logger } from "@/app/utils/logger"
import { inngest } from "@/app/utils/inngest/client"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a company
    if (session.user.userType !== "COMPANY") {
      return NextResponse.json({ error: "Only companies can post jobs" }, { status: 403 })
    }

    // Get the company ID
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 })
    }

    const jobData = await req.json()

    logger.info(`Creating job post for company ${company.id}`, jobData)

    // Create the job post
    const newJob = await prisma.jobPost.create({
      data: {
        ...jobData,
        companyId: company.id,
        status: "ACTIVE",
      },
      include: {
        company: true,
      },
    })

    logger.info(`Job created successfully: ${newJob.id}`)

    // Trigger the job matching process to find potential candidates
    logger.info(`Sending job/created event for job: ${newJob.id}`, {
      jobId: newJob.id,
      companyId: company.id,
    })

    await inngest.send({
      name: "job/created",
      data: {
        jobId: newJob.id,
        companyId: company.id,
      },
    })

    return NextResponse.json(newJob)
  } catch (error) {
    logger.error("Error creating job post:", error)
    return NextResponse.json({ error: "Failed to create job post" }, { status: 500 })
  }
}

