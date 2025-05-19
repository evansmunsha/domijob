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

    const { companyId, jobId, matchScore = 85, skills = ["JavaScript", "React", "TypeScript"] } = await req.json()

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

    // Create a potential candidate notification
    const notification = await prisma.companyNotification.create({
      data: {
        companyId,
        jobId: jobId || undefined,
        type: "POTENTIAL_CANDIDATE",
        message: `A job seeker with ${matchScore}% skill match viewed your profile`,
        read: false,
        metadata: JSON.stringify({
          skills,
          matchScore,
          viewerName: "Test Candidate",
        }),
      },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("Error simulating potential candidate:", error)
    return NextResponse.json({ error: "Failed to simulate potential candidate" }, { status: 500 })
  }
}

