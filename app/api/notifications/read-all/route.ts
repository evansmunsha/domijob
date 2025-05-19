import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST() {
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

    // Mark all notifications as read based on user type
    if (companyId) {
      await prisma.companyNotification.updateMany({
        where: {
          companyId,
          read: false,
        },
        data: { read: true },
      })
    } else {
      // For job seeker notifications
      await prisma.userNotification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: { read: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 })
  }
}

