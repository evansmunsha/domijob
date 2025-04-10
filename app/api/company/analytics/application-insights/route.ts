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

    // Get applications data
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
        job: true,
      },
    })

    // Calculate application status distribution
    const statusDistribution = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate applications by job
    const applicationsByJob = applications.reduce((acc, app) => {
      const jobTitle = app.job.jobTitle
      acc[jobTitle] = (acc[jobTitle] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate candidate demographics - using userId instead of candidate
    const candidateDemographics = applications.reduce((acc, app) => {
      const experience = "Unknown" // Replace with actual experience if available
      acc[experience] = (acc[experience] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate application trends over time
    const applicationTrends = applications.reduce((acc, _) => {
      const date = new Date().toISOString().split("T")[0]
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
      candidateDemographics: Object.entries(candidateDemographics).map(([experience, count]) => ({
        experience,
        count,
      })),
      applicationTrends: Object.entries(applicationTrends).map(([date, count]) => ({
        date,
        count,
      })),
      period,
    })
  } catch (error) {
    console.error("[APPLICATION_INSIGHTS]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}