import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { z } from "zod"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  candidateName: z.string(),
  message: z.string().min(10, "Message must be at least 10 characters long"),
  candidateId: z.string().optional(),
  notificationId: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    const notification = await prisma.companyNotification.findUnique({
      where: { id: validatedData.notificationId },
      select: { metadata: true, jobId: true },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    type NotificationMetadata = {
      userId?: string
      [key: string]: unknown
    }

    let metadata: NotificationMetadata = {}
    try {
      metadata = JSON.parse(notification.metadata || "{}")
    } catch (error) {
      console.error("Error parsing notification metadata:", error)
    }

    const candidateId = validatedData.candidateId || metadata.userId

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID not found" }, { status: 400 })
    }

    await prisma.companyNotification.update({
      where: { id: validatedData.notificationId },
      data: { read: true },
    })

    const contactRecord = await prisma.candidateContact.create({
      data: {
        companyId: company.id,
        candidateName: validatedData.candidateName,
        message: validatedData.message,
        candidateId: candidateId,
        notificationId: validatedData.notificationId,
      },
    })

    const jobSeeker = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { email: true, JobSeeker: { select: { name: true } } },
    })

    const chatThread = await prisma.chatThread.create({
      data: {
        companyId: company.id,
        jobSeekerId: candidateId,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: session.user.id,
            senderType: "COMPANY",
            content: validatedData.message,
          },
        },
      },
      include: {
        messages: true,
      },
    })

    await prisma.userNotification.create({
      data: {
        userId: candidateId,
        type: "NEW_MESSAGE",
        message: `${company.name} has sent you a message`,
        read: false,
        metadata: JSON.stringify({
          companyId: company.id,
          companyName: company.name,
          threadId: chatThread.id,
        }),
      },
    })

    if (jobSeeker?.email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

        await resend.emails.send({
          from: `DoMiJob <onboarding@resend.dev>`,
          to: [jobSeeker.email],
          subject: `${company.name} is interested in your profile`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Message from ${company.name}</title></head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #0066cc; color: #ffffff; text-align: center; padding: 20px;">
                  <h1 style="margin: 0;">New Message from ${company.name}</h1>
                </div>
                <div style="padding: 20px;">
                  <p>Hello ${jobSeeker.JobSeeker?.name || validatedData.candidateName},</p>
                  <p>${company.name} has shown interest in your profile and sent you a message:</p>
                  <div style="background-color: #f9f9f9; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
                    <p style="white-space: pre-line;">${validatedData.message}</p>
                  </div>
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${baseUrl}/messages/${chatThread.id}" style="background-color: #0066cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">Reply to Message</a>
                  </div>
                  <p style="margin-top: 30px;">You can also view and reply to this message directly in your DoMiJob inbox.</p>
                </div>
                <div style="background-color: #f0f0f0; text-align: center; padding: 10px; font-size: 12px; color: #666;">
                  <p>This email was sent to you because a company on DoMiJob is interested in your profile.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        })

        console.log(`Email sent to ${jobSeeker.email}`)
      } catch (emailError) {
        console.error("Error sending email:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Contact message sent successfully",
      contactId: contactRecord.id,
      threadId: chatThread.id,
    })
  } catch (error) {
    console.error("Error sending contact message:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to send contact message" }, { status: 500 })
  }
}