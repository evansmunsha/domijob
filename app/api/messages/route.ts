import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")

    // Determine if the user is a company or job seeker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true, company: { select: { id: true } } },
    })

    let threads

    if (user?.userType === "COMPANY") {
      // Get threads for company
      threads = await prisma.chatThread.findMany({
        where: {
          companyId: user.company?.id,
        },
        include: {
          jobSeeker: {
            select: {
              id: true,
              name: true,
              image: true,
              JobSeeker: {
                select: {
                  name: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
        take: limit,
      })
    } else {
      // Get threads for job seeker
      threads = await prisma.chatThread.findMany({
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
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
        take: limit,
      })
    }

    // Format the threads for the response
    const formattedThreads = threads.map((thread) => {
      const lastMessage = thread.messages[0]

      return {
        id: thread.id,
        participant:
          user?.userType === "COMPANY"
            ? {
                id: thread.jobSeeker.id,
                name: thread.jobSeeker.JobSeeker?.name || thread.jobSeeker.name || "Job Seeker",
                image: thread.jobSeeker.image,
                type: "JOB_SEEKER",
              }
            : {
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
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

