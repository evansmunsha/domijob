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

    // Get unread notification count based on user type
    let unreadCount = 0

    if (companyId) {
      // Company notifications
      unreadCount = await prisma.companyNotification.count({
        where: {
          companyId,
          read: false,
        },
      })
    } else {
      // Job seeker notifications
      unreadCount = await prisma.userNotification.count({
        where: {
          userId: session.user.id,
          read: false,
        },
      })
    }

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error("Error fetching notification count:", error)
    return NextResponse.json({ error: "Failed to fetch notification count" }, { status: 500 })
  }
}

