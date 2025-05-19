import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST(req: Request) {
  try {
    const session = await auth()

    // Only allow in development environment
    if (process.env.NODE_ENV !== "development" || process.env.ALLOW_TEST_ENDPOINTS !== "true") {
      return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 403 })
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a company
    if (session.user.userType !== "COMPANY") {
      return NextResponse.json({ error: "Only companies can access this endpoint" }, { status: 403 })
    }

    const { type, message, jobId, metadata } = await req.json()

    // Get the company ID
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 })
    }

    // Create the notification
    const notification = await prisma.companyNotification.create({
      data: {
        companyId: company.id,
        type: type || "TEST_NOTIFICATION",
        message: message || "This is a test notification",
        jobId: jobId || undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        read: false,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error("Error creating test notification:", error)
    return NextResponse.json({ error: "Failed to create test notification" }, { status: 500 })
  }
}

