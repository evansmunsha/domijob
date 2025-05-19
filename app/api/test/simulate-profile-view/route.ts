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

    const { companyId, location, userId, count = 1 } = await req.json()

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

    // Create multiple profile views if count is specified
    const results = []
    for (let i = 0; i < count; i++) {
      // Record the profile view
      const profileView = await prisma.companyProfileView.create({
        data: {
          companyId,
          userId: userId || undefined,
          timestamp: new Date(),
          location: location || "Test Location",
        },
      })
      results.push(profileView)
    }

    // Create a notification for the company
    await prisma.companyNotification.create({
      data: {
        companyId,
        type: "PROFILE_VIEWS",
        message: `${count} test profile view(s) recorded`,
        read: false,
      },
    })

    return NextResponse.json({ success: true, count, results })
  } catch (error) {
    console.error("Error simulating profile view:", error)
    return NextResponse.json({ error: "Failed to simulate profile view" }, { status: 500 })
  }
}

