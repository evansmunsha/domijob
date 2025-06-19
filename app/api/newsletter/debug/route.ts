import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Test database connection
    console.log("🔍 Testing newsletter subscription debug...")

    const [totalSubscriptions, activeSubscriptions, recentSubscriptions, databaseConnection] = await Promise.all([
      prisma.newsletterSubscription.count().catch((e) => ({ error: e.message })),
      prisma.newsletterSubscription.count({ where: { status: "ACTIVE" } }).catch((e) => ({ error: e.message })),
      prisma.newsletterSubscription
        .findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            status: true,
            source: true,
            createdAt: true,
            preferences: true,
          },
        })
        .catch((e) => ({ error: e.message })),
      prisma.$queryRaw`SELECT 1 as connection_test`.catch((e) => ({ error: e.message })),
    ])

    const debugInfo = {
      timestamp: new Date().toISOString(),
      database: {
        connection: Array.isArray(databaseConnection)
          ? "✅ Connected"
          : `❌ Error: ${(databaseConnection as any).error}`,
        totalSubscriptions:
          typeof totalSubscriptions === "number" ? totalSubscriptions : `❌ Error: ${totalSubscriptions.error}`,
        activeSubscriptions:
          typeof activeSubscriptions === "number" ? activeSubscriptions : `❌ Error: ${activeSubscriptions.error}`,
      },
      recentSubscriptions: Array.isArray(recentSubscriptions)
        ? recentSubscriptions
        : `❌ Error: ${recentSubscriptions.error}`,
      environment: {
        hasEmailService: !!process.env.RESEND_API_KEY || !!process.env.SENDGRID_API_KEY,
        hasNextPublicUrl: !!process.env.NEXT_PUBLIC_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("❌ Newsletter debug error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required for testing" }, { status: 400 })
    }

    console.log("🧪 Testing newsletter subscription for:", email)

    // Test the subscription process step by step
    const testResults = {
      email,
      timestamp: new Date().toISOString(),
      steps: {} as any,
    }

    // Step 1: Check existing subscription
    try {
      const existing = await prisma.newsletterSubscription.findUnique({
        where: { email },
      })
      testResults.steps.checkExisting = {
        success: true,
        found: !!existing,
        status: existing?.status || null,
      }
    } catch (error) {
      testResults.steps.checkExisting = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Step 2: Test user lookup
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true },
      })
      testResults.steps.userLookup = {
        success: true,
        found: !!user,
        userId: user?.id || null,
      }
    } catch (error) {
      testResults.steps.userLookup = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Step 3: Test subscription creation (dry run)
    try {
      const subscriptionData = {
        email,
        userId: null,
        status: "ACTIVE",
        preferences: {
          jobAlerts: true,
          careerTips: true,
          weeklyDigest: true,
          productUpdates: false,
        },
        tags: ["general"],
        source: "debug-test",
        confirmedAt: new Date(),
      }

      testResults.steps.subscriptionData = {
        success: true,
        data: subscriptionData,
      }
    } catch (error) {
      testResults.steps.subscriptionData = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    return NextResponse.json(testResults)
  } catch (error) {
    console.error("❌ Newsletter debug test error:", error)
    return NextResponse.json(
      {
        error: "Debug test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
