import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"
import { redis } from "@/app/utils/redis"
import { Prisma } from "@prisma/client"

const CACHE_TTL = 60 * 5 // 5 minutes

type JobWithApplications = Prisma.JobPostGetPayload<{
  include: {
    JobApplication: {
      include: {
        user: {
          select: {
            userType: true
          }
        }
      }
    }
  }
}>

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
    const cacheKey = `job-performance:${companyId}:${period}`
    const cachedData = await redis.get(cacheKey)
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

    // Get jobs with applications
    const jobs = await prisma.jobPost.findMany({
      where: {
        companyId: companyId,
        createdAt: {
          lte: now,
        },
      },
      include: {
        JobApplication: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          include: {
            user: {
              select: {
                userType: true,
              },
            },
          },
        },
      },
    }) as JobWithApplications[]

    // Get profile views for the company
    const profileViews = await prisma.companyProfileView.findMany({
      where: {
        companyId: companyId,
        timestamp: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            userType: true,
          },
        },
      },
    })

    // Calculate detailed job metrics
    const jobMetrics = jobs.map((job) => {
      const jobViews = profileViews.filter(view => view.timestamp >= job.createdAt)
      const viewsByUserType = jobViews.reduce((acc: Record<string, number>, view) => {
        const userType = view.user?.userType || "UNKNOWN"
        acc[userType] = (acc[userType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const applicationsByUserType = job.JobApplication.reduce((acc: Record<string, number>, app) => {
        const userType = app.user?.userType || "UNKNOWN"
        acc[userType] = (acc[userType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        jobId: job.id,
        jobTitle: job.jobTitle,
        views: jobViews.length,
        applications: job.JobApplication.length,
        conversionRate: jobViews.length > 0 
          ? Math.round((job.JobApplication.length / jobViews.length) * 100) 
          : 0,
        viewsByUserType: Object.entries(viewsByUserType).map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / jobViews.length) * 100),
        })),
        applicationsByUserType: Object.entries(applicationsByUserType).map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / job.JobApplication.length) * 100),
        })),
      }
    })

    // Calculate performance trends with user type breakdown
    const performanceTrends = Array.from({ length: days }, (_, i) => {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dailyViews = profileViews.filter(view => 
        view.timestamp.toISOString().split("T")[0] === dateStr
      ).length

      const dailyApplications = jobs.reduce((acc: number, job) => 
        acc + job.JobApplication.filter((app) => 
          app.createdAt.toISOString().split("T")[0] === dateStr
        ).length, 0)

      const viewsByUserType = profileViews
        .filter(view => view.timestamp.toISOString().split("T")[0] === dateStr)
        .reduce((acc: Record<string, number>, view) => {
          const userType = view.user?.userType || "UNKNOWN"
          acc[userType] = (acc[userType] || 0) + 1
          return acc
        }, {})

      const applicationsByUserType = jobs.flatMap(job => 
        job.JobApplication.filter(app => 
          app.createdAt.toISOString().split("T")[0] === dateStr
        )
      ).reduce((acc: Record<string, number>, app) => {
        const userType = app.user?.userType || "UNKNOWN"
        acc[userType] = (acc[userType] || 0) + 1
        return acc
      }, {})

      return {
        date: dateStr,
        totalViews: dailyViews,
        totalApplications: dailyApplications,
        viewsByUserType: Object.entries(viewsByUserType).map(([type, count]) => ({
          type,
          count,
        })),
        applicationsByUserType: Object.entries(applicationsByUserType).map(([type, count]) => ({
          type,
          count,
        })),
      }
    }).reverse()

    const responseData = {
      jobMetrics,
      performanceTrends,
      period,
      totalJobs: jobs.length,
      totalViews: profileViews.length,
      totalApplications: jobs.reduce((acc, job) => acc + job.JobApplication.length, 0),
      averageConversionRate: jobs.length > 0
        ? Math.round(jobs.reduce((acc, job) => {
            const jobViews = profileViews.filter(view => view.timestamp >= job.createdAt)
            const rate = jobViews.length > 0 
              ? (job.JobApplication.length / jobViews.length) * 100 
              : 0
            return acc + rate
          }, 0) / jobs.length)
        : 0,
    }

    // Cache the response
    await redis.set(cacheKey, JSON.stringify(responseData), { ex: CACHE_TTL })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[JOB_PERFORMANCE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 