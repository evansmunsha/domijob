import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's company ID if they are a company user
    let companyId = null
    if (session.user.userType === "COMPANY") {
      const company = await prisma.company.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      companyId = company?.id
    }

    // Get notifications based on user type
    let notifications
    if (companyId) {
      // Company notifications
      notifications = await prisma.companyNotification.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          job: {
            select: {
              jobTitle: true,
            },
          },
        },
      })
    } else {
      // Job seeker notifications
      notifications = await prisma.userNotification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          job: {
            select: {
              jobTitle: true,
            },
          },
        },
      })
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

