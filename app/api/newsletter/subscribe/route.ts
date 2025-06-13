import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
// import { sendEmail } from "@/app/utils/emailService" // Commented out for now
import { z } from "zod"

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  preferences: z.object({
    jobAlerts: z.boolean().optional(),
    careerTips: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    productUpdates: z.boolean().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source, tags, preferences } = subscribeSchema.parse(body)

    // Check if already subscribed
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    })

    if (existingSubscription) {
      if (existingSubscription.status === "ACTIVE") {
        return NextResponse.json(
          { message: "Already subscribed to newsletter" },
          { status: 200 }
        )
      } else {
        // Reactivate subscription
        await prisma.newsletterSubscription.update({
          where: { email },
          data: {
            status: "ACTIVE",
            preferences: preferences || (existingSubscription.preferences || {
              jobAlerts: true,
              careerTips: true,
              weeklyDigest: true,
              productUpdates: false
            }),
            tags: tags || existingSubscription.tags,
            source: source || existingSubscription.source,
            confirmedAt: new Date(),
            unsubscribedAt: null
          }
        })
      }
    } else {
      // Check if user exists
      const session = await auth()
      let userId = null

      if (session?.user?.id) {
        userId = session.user.id
      } else {
        // Check if email belongs to existing user
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true }
        })
        if (user) {
          userId = user.id
        }
      }

      // Create new subscription
      await prisma.newsletterSubscription.create({
        data: {
          email,
          userId,
          status: "ACTIVE",
          preferences: preferences || {
            jobAlerts: true,
            careerTips: true,
            weeklyDigest: true,
            productUpdates: false
          },
          tags: tags || ["general"],
          source: source || "website",
          confirmedAt: new Date()
        }
      })
    }

    // Send welcome email (commented out for now - will implement later)
    try {
      console.log(`Welcome email would be sent to: ${email}`)
      // TODO: Implement email sending when email service is configured
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      message: "Successfully subscribed to newsletter",
      email
    })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")
    const tag = searchParams.get("tag")

    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (tag) where.tags = { has: tag }

    const [subscriptions, total] = await Promise.all([
      prisma.newsletterSubscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              userType: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.newsletterSubscription.count({ where })
    ])

    return NextResponse.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching newsletter subscriptions:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    )
  }
}
