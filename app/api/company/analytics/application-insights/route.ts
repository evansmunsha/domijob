import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"

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

    // Get applications data with user and job details
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
            id: true,
            email: true,
            userType: true,
          },
        },
      },
    })

    // Log applications with unknown user type
    const unknownUserTypeApps = applications.filter(app => !app.user?.userType)
    if (unknownUserTypeApps.length > 0) {
      console.warn(`Found ${unknownUserTypeApps.length} applications with unknown user type:`, 
        unknownUserTypeApps.map(app => ({
          applicationId: app.id,
          userId: app.userId,
          userEmail: app.user?.email,
          createdAt: app.createdAt
        }))
      )
    }

    // Calculate application status distribution
    const statusDistribution = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate applications by job
    const applicationsByJob = applications.reduce((acc, app) => {
      const jobTitle = app.job?.jobTitle || "Unknown Job"
      acc[jobTitle] = (acc[jobTitle] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate candidate demographics based on user type
    const candidateDemographics = applications.reduce((acc, app) => {
      const userType = app.user?.userType || "UNKNOWN"
      acc[userType] = (acc[userType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate application trends over time
    const applicationTrends = applications.reduce((acc, app) => {
      const date = app.createdAt.toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalApplications: applications.length,
      statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
        status,
        count,
      })),
      applicationsByJob: Object.entries(applicationsByJob).map(([job, count]) => ({
        job,
        count,
      })),
      candidateDemographics: Object.entries(candidateDemographics).map(([userType, count]) => ({
        userType,
        count,
      })),
      applicationTrends: Object.entries(applicationTrends).map(([date, count]) => ({
        date,
        count,
      })),
      period,
      unknownUserTypeCount: unknownUserTypeApps.length
    })
  } catch (error) {
    console.error("[APPLICATION_INSIGHTS]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}