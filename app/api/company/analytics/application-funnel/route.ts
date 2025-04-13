import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"
import { redis } from "@/app/utils/redis"
import { ApplicationStatus } from "@prisma/client"

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const period = searchParams.get("period") || "30d"

    if (!companyId) {
      return new NextResponse("Company ID is required", { status: 400 })
    }

    // Check cache first
    const cacheKey = `application-funnel:${companyId}:${period}`
    let cachedData = null
    try {
      cachedData = await redis.get(cacheKey)
    } catch (redisError) {
      console.error("[APPLICATION_FUNNEL] Redis error:", redisError)
      // Continue without cache if Redis fails
    }

    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData as string))
    }

    // Verify company access
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    })

    if (!company) {
      return new NextResponse("Company not found or access denied", { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    const days = parseInt(period.replace("d", ""))
    const startDate = new Date(now.setDate(now.getDate() - days))

    // Get applications data with more details
    const applications = await prisma.jobApplication.findMany({
      where: {
        job: {
          companyId: companyId,
        },
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        job: {
          select: {
            jobTitle: true,
          },
        },
        user: {
          select: {
            userType: true,
          },
        },
      },
    })

    // Calculate detailed funnel metrics
    const totalApplications = applications.length
    const completedApplications = applications.filter(app => 
      app.status === ApplicationStatus.REJECTED
    ).length
    const shortlistedApplications = applications.filter(app => 
      app.status === ApplicationStatus.SHORTLISTED
    ).length
    const reviewingApplications = applications.filter(app => 
      app.status === ApplicationStatus.REVIEWING
    ).length
    const pendingApplications = applications.filter(app => 
      app.status === ApplicationStatus.PENDING
    ).length

    // Calculate metrics by user type
    const applicationsByUserType = applications.reduce((acc, app) => {
      const userType = app.user?.userType || "UNKNOWN"
      acc[userType] = (acc[userType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const funnelMetrics = [
      {
        stage: "Applications Started",
        count: totalApplications,
        dropoffRate: 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / totalApplications) * 100),
        })),
      },
      {
        stage: "Applications Completed",
        count: completedApplications,
        dropoffRate: totalApplications > 0 
          ? Math.round(((totalApplications - completedApplications) / totalApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const completed = applications.filter(app => 
            app.user?.userType === type && 
            (app.status === "REJECTED")
          ).length
          return {
            type,
            count: completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          }
        }),
      },
      {
        stage: "Shortlisted",
        count: shortlistedApplications,
        dropoffRate: completedApplications > 0
          ? Math.round(((completedApplications - shortlistedApplications) / completedApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const shortlisted = applications.filter(app => 
            app.user?.userType === type && 
            app.status === "SHORTLISTED"
          ).length
          return {
            type,
            count: shortlisted,
            percentage: total > 0 ? Math.round((shortlisted / total) * 100) : 0,
          }
        }),
      },
      {
        stage: "Interviewed",
        count: reviewingApplications,
        dropoffRate: shortlistedApplications > 0
          ? Math.round(((shortlistedApplications - reviewingApplications) / shortlistedApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const interviewed = applications.filter(app => 
            app.user?.userType === type && 
            app.status === "REVIEWING"
          ).length
          return {
            type,
            count: interviewed,
            percentage: total > 0 ? Math.round((interviewed / total) * 100) : 0,
          }
        }),
      },
      {
        stage: "PENDING",
        count: pendingApplications,
        dropoffRate: reviewingApplications > 0
          ? Math.round(((reviewingApplications - pendingApplications) / reviewingApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const hired = applications.filter(app => 
            app.user?.userType === type && 
            app.status === "PENDING"
          ).length
          return {
            type,
            count: hired,
            percentage: total > 0 ? Math.round((hired / total) * 100) : 0,
          }
        }),
      },
    ]

    // Calculate conversion trends with user type breakdown
    const conversionTrends = Array.from({ length: days }, (_, i) => {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dailyApplications = applications.filter(app => 
        app.createdAt.toISOString().split("T")[0] === dateStr
      )

      const totalDailyApplications = dailyApplications.length
      const completedDailyApplications = dailyApplications.filter(app => 
        app.status === "REJECTED"
      ).length

      const applicationsByUserType = dailyApplications.reduce((acc, app) => {
        const userType = app.user?.userType || "UNKNOWN"
        acc[userType] = (acc[userType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const completedByUserType = dailyApplications.reduce((acc, app) => {
        if (app.status === "REJECTED") {
          const userType = app.user?.userType || "UNKNOWN"
          acc[userType] = (acc[userType] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      return {
        date: dateStr,
        totalApplications: totalDailyApplications,
        completedApplications: completedDailyApplications,
        applicationsByUserType: Object.entries(applicationsByUserType).map(([type, count]) => ({
          type,
          count,
        })),
        completedByUserType: Object.entries(completedByUserType).map(([type, count]) => ({
          type,
          count,
        })),
      }
    }).reverse()

    const responseData = {
      funnelMetrics,
      conversionTrends,
      period,
      totalApplications,
      completedApplications,
      shortlistedApplications,
      reviewingApplications,
      pendingApplications,
      overallConversionRate: totalApplications > 0
        ? Math.round((pendingApplications / totalApplications) * 100)
        : 0,
    }

    // Cache the response
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), { ex: CACHE_TTL })
    } catch (redisError) {
      console.error("[APPLICATION_FUNNEL] Redis error:", redisError)
      // Continue without caching if Redis fails
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[APPLICATION_FUNNEL]", error)
    return NextResponse.json({ error: "Failed to fetch application funnel data" }, { status: 500 })
  }
} 