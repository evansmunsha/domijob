import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Determine if the user is a company or job seeker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true, Company: { select: { id: true } } },
    })

    let unreadCount = 0

    if (user?.userType === "COMPANY") {
      // Count unread messages for company
      unreadCount = await prisma.chatMessage.count({
        where: {
          thread: {
            companyId: user.Company?.id,
          },
          senderType: "JOB_SEEKER",
          read: false,
        },
      })
    } else {
      // Count unread messages for job seeker
      unreadCount = await prisma.chatMessage.count({
        where: {
          thread: {
            jobSeekerId: session.user.id,
          },
          senderType: "COMPANY",
          read: false,
        },
      })
    }

    return NextResponse.json({ count: unreadCount })
  } catch (error) {
    console.error("Error fetching unread message count:", error)
    return NextResponse.json({ error: "Failed to fetch unread message count" }, { status: 500 })
  }
}

