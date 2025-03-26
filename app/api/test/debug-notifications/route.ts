import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(req: Request) {
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

    // Get the company ID
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 })
    }

    // Get all notifications for debugging
    const notifications = await prisma.companyNotification.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    })

    // Get profile views for debugging
    const profileViews = await prisma.companyProfileView.findMany({
      where: { companyId: company.id },
      orderBy: { timestamp: "desc" },
      take: 50,
    })

    // Get notification counts
    const notificationCounts = await prisma.companyNotification.groupBy({
      by: ["type"],
      where: { companyId: company.id },
      _count: true,
    })

    return NextResponse.json({
      companyId: company.id,
      notifications,
      profileViews,
      notificationCounts,
      unreadCount: await prisma.companyNotification.count({
        where: { companyId: company.id, read: false },
      }),
    })
  } catch (error) {
    console.error("Error debugging notifications:", error)
    return NextResponse.json({ error: "Failed to debug notifications" }, { status: 500 })
  }
}

