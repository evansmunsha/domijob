import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"
import { redis } from "@/app/utils/redis"

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
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData))
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
      app.status === "COMPLETED" || app.status === "REJECTED"
    ).length
    const interviewedApplications = applications.filter(app => 
      app.status === "INTERVIEWED"
    ).length
    const shortlistedApplications = applications.filter(app => 
      app.status === "SHORTLISTED"
    ).length
    const hiredApplications = applications.filter(app => 
      app.status === "HIRED"
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
            (app.status === "COMPLETED" || app.status === "REJECTED")
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
        count: interviewedApplications,
        dropoffRate: shortlistedApplications > 0
          ? Math.round(((shortlistedApplications - interviewedApplications) / shortlistedApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const interviewed = applications.filter(app => 
            app.user?.userType === type && 
            app.status === "INTERVIEWED"
          ).length
          return {
            type,
            count: interviewed,
            percentage: total > 0 ? Math.round((interviewed / total) * 100) : 0,
          }
        }),
      },
      {
        stage: "Hired",
        count: hiredApplications,
        dropoffRate: interviewedApplications > 0
          ? Math.round(((interviewedApplications - hiredApplications) / interviewedApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const hired = applications.filter(app => 
            app.user?.userType === type && 
            app.status === "HIRED"
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
        app.status === "COMPLETED" || app.status === "REJECTED"
      ).length

      const applicationsByUserType = dailyApplications.reduce((acc, app) => {
        const userType = app.user?.userType || "UNKNOWN"
        acc[userType] = (acc[userType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const completedByUserType = dailyApplications.reduce((acc, app) => {
        if (app.status === "COMPLETED" || app.status === "REJECTED") {
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
      interviewedApplications,
      hiredApplications,
      overallConversionRate: totalApplications > 0
        ? Math.round((hiredApplications / totalApplications) * 100)
        : 0,
    }

    // Cache the response
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", CACHE_TTL)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[APPLICATION_FUNNEL]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"
import { redis } from "@/app/utils/redis"

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
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData))
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
      app.status === "COMPLETED" || app.status === "REJECTED"
    ).length
    const interviewedApplications = applications.filter(app => 
      app.status === "INTERVIEWED"
    ).length
    const shortlistedApplications = applications.filter(app => 
      app.status === "SHORTLISTED"
    ).length
    const hiredApplications = applications.filter(app => 
      app.status === "HIRED"
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
            (app.status === "COMPLETED" || app.status === "REJECTED")
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
        count: interviewedApplications,
        dropoffRate: shortlistedApplications > 0
          ? Math.round(((shortlistedApplications - interviewedApplications) / shortlistedApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const interviewed = applications.filter(app => 
            app.user?.userType === type && 
            app.status === "INTERVIEWED"
          ).length
          return {
            type,
            count: interviewed,
            percentage: total > 0 ? Math.round((interviewed / total) * 100) : 0,
          }
        }),
      },
      {
        stage: "Hired",
        count: hiredApplications,
        dropoffRate: interviewedApplications > 0
          ? Math.round(((interviewedApplications - hiredApplications) / interviewedApplications) * 100)
          : 0,
        byUserType: Object.entries(applicationsByUserType).map(([type, total]) => {
          const hired = applications.filter(app => 
            app.user?.userType === type && 
            app.status === "HIRED"
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
        app.status === "COMPLETED" || app.status === "REJECTED"
      ).length

      const applicationsByUserType = dailyApplications.reduce((acc, app) => {
        const userType = app.user?.userType || "UNKNOWN"
        acc[userType] = (acc[userType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const completedByUserType = dailyApplications.reduce((acc, app) => {
        if (app.status === "COMPLETED" || app.status === "REJECTED") {
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
      interviewedApplications,
      hiredApplications,
      overallConversionRate: totalApplications > 0
        ? Math.round((hiredApplications / totalApplications) * 100)
        : 0,
    }

    // Cache the response
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", CACHE_TTL)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[APPLICATION_FUNNEL]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 