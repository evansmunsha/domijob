import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = params.id

    // Get user's company ID if they are a company user
    let companyId = null
    if (session.user.userType === "COMPANY") {
      const company = await prisma.company.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      companyId = company?.id
    }

    // Mark notification as read based on user type
    if (companyId) {
      // Verify the notification belongs to this company
      const notification = await prisma.companyNotification.findFirst({
        where: {
          id: notificationId,
          companyId,
        },
      })

      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      // Update the notification
      await prisma.companyNotification.update({
        where: { id: notificationId },
        data: { read: true },
      })
    } else {
      // For job seeker notifications
      const notification = await prisma.userNotification.findFirst({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      })

      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      // Update the notification
      await prisma.userNotification.update({
        where: { id: notificationId },
        data: { read: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}

