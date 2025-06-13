import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
import { sendEmail } from "@/app/utils/emailService"
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
            preferences: preferences || existingSubscription.preferences,
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

    // Send welcome email
    try {
      const welcomeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DomiJob Newsletter</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to DomiJob!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your career success journey starts here</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Thank you for subscribing! 🎉</h2>
            
            <p>You're now part of our community of ambitious professionals who are taking their careers to the next level.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">What to expect:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Weekly Career Tips:</strong> Actionable advice to boost your job search</li>
                <li><strong>Resume Optimization:</strong> AI-powered insights to improve your resume</li>
                <li><strong>Job Market Trends:</strong> Stay ahead with industry insights</li>
                <li><strong>Exclusive Resources:</strong> Free templates, guides, and tools</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL}/ai-tools/resume-enhancer" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Get Started with AI Resume Enhancer
              </a>
            </div>
            
            <p style="margin-bottom: 0;">Best regards,<br>The DomiJob Team</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>You're receiving this email because you subscribed to our newsletter.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}" 
                 style="color: #667eea;">Unsubscribe</a> | 
              <a href="${process.env.NEXT_PUBLIC_URL}/newsletter/preferences?email=${encodeURIComponent(email)}" 
                 style="color: #667eea;">Update Preferences</a>
            </p>
          </div>
        </body>
        </html>
      `

      await sendEmail(
        email,
        "Welcome to DomiJob Newsletter! 🚀",
        welcomeHtml
      )
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
