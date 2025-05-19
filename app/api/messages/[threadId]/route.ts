import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { z } from "zod"

// Schema for validating new message requests
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
})

export async function GET(_request: Request, context: { params: Promise<{ threadId: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await the params Promise to get the actual params
    const { threadId } = await context.params

    // Verify the user has access to this thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ jobSeekerId: session.user.id }, { company: { userId: session.user.id } }],
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            userId: true,
          },
        },
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
      },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found or access denied" }, { status: 404 })
    }

    // Get messages for this thread
    const messages = await prisma.chatMessage.findMany({
      where: {
        threadId,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Mark unread messages as read if the user is the recipient
    const unreadMessages = messages.filter((msg) => !msg.read && msg.senderId !== session.user.id)

    if (unreadMessages.length > 0) {
      await prisma.chatMessage.updateMany({
        where: {
          id: {
            in: unreadMessages.map((msg) => msg.id),
          },
        },
        data: {
          read: true,
        },
      })
    }

    // Determine if the current user is the company or job seeker
    const isCompany = thread.company.userId === session.user.id

    // Format the response
    const response = {
      thread: {
        id: thread.id,
        participant: isCompany
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
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        sentAt: msg.createdAt,
        isFromUser: msg.senderId === session.user.id,
        read: msg.read,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching thread messages:", error)
    return NextResponse.json({ error: "Failed to fetch thread messages" }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ threadId: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await the params Promise to get the actual params
    const { threadId } = await context.params

    // Verify the user has access to this thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ jobSeekerId: session.user.id }, { company: { userId: session.user.id } }],
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found or access denied" }, { status: 404 })
    }

    // Parse and validate the request body
    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    // Determine sender type
    const senderType = thread.company.userId === session.user.id ? "COMPANY" : "JOB_SEEKER"

    // Create the new message
    const message = await prisma.chatMessage.create({
      data: {
        threadId,
        senderId: session.user.id,
        senderType,
        content: validatedData.content,
      },
    })

    // Update the thread's lastMessageAt timestamp
    await prisma.chatThread.update({
      where: {
        id: threadId,
      },
      data: {
        lastMessageAt: new Date(),
      },
    })

    // Create a notification for the recipient
    const recipientId = senderType === "COMPANY" ? thread.jobSeekerId : thread.company.userId

    await prisma.userNotification.create({
      data: {
        userId: recipientId,
        type: "NEW_MESSAGE",
        message: `New message from ${senderType === "COMPANY" ? thread.company.name : "a job seeker"}`,
        read: false,
        metadata: JSON.stringify({
          threadId,
          messageId: message.id,
        }),
      },
    })

    return NextResponse.json({
      id: message.id,
      content: message.content,
      sentAt: message.createdAt,
      isFromUser: true,
      read: false,
    })
  } catch (error) {
    console.error("Error sending message:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

