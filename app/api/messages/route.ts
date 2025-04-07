import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        Company: { select: { id: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.userType === "COMPANY") {
      const threads = await prisma.chatThread.findMany({
        where: {
          companyId: user.Company?.id,
        },
        include: {
          jobSeeker: {
            select: {
              id: true,
              name: true,
              image: true,
              JobSeeker: {
                select: { name: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: limit,
      })

      const formattedThreads = threads.map((thread) => {
        const lastMessage = thread.messages[0]
        return {
          id: thread.id,
          participant: {
            id: thread.jobSeeker.id,
            name:
              thread.jobSeeker.JobSeeker?.name ||
              thread.jobSeeker.name ||
              "Job Seeker",
            image: thread.jobSeeker.image,
            type: "JOB_SEEKER",
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                sentAt: lastMessage.createdAt,
                isFromUser: lastMessage.senderId === session.user.id,
                read: lastMessage.read,
              }
            : null,
          updatedAt: thread.lastMessageAt,
        }
      })

      return NextResponse.json(formattedThreads)
    } else {
      const threads = await prisma.chatThread.findMany({
        where: {
          jobSeekerId: session.user.id,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: limit,
      })

      const formattedThreads = threads.map((thread) => {
        const lastMessage = thread.messages[0]
        return {
          id: thread.id,
          participant: {
            id: thread.company.id,
            name: thread.company.name,
            image: thread.company.logo,
            type: "COMPANY",
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                sentAt: lastMessage.createdAt,
                isFromUser: lastMessage.senderId === session.user.id,
                read: lastMessage.read,
              }
            : null,
          updatedAt: thread.lastMessageAt,
        }
      })

      return NextResponse.json(formattedThreads)
    }
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
