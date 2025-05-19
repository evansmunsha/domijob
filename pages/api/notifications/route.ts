import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

// Shared interface for notifications
interface BaseNotification {
  id: string
  message: string
  createdAt: Date
  read: boolean
  jobId: string | null
  type: string
  metadata: string | null
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    console.log(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    })

    let notifications: BaseNotification[] = []

    if (user?.userType === "JOB_SEEKER") {
      notifications = await prisma.userNotification.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    } else if (user?.userType === "COMPANY") {
      const company = await prisma.company.findUnique({
        where: { userId: session.user.id },
      })

      if (company) {
        notifications = await prisma.companyNotification.findMany({
          where: {
            companyId: company.id,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      }
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationIds } = await req.json()

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Notification IDs are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    })

    if (user?.userType === "JOB_SEEKER") {
      await prisma.userNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: { read: true },
      })
    } else if (user?.userType === "COMPANY") {
      const company = await prisma.company.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      if (company) {
        await prisma.companyNotification.updateMany({
          where: {
            id: { in: notificationIds },
            companyId: company.id,
          },
          data: { read: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
  }
}
