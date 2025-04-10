import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const url = new URL(req.url)
    const companyId = url.searchParams.get("companyId")
    const period = url.searchParams.get("period") || "30d"

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Verify company access
    if (session.user.userType === "COMPANY") {
      const userCompany = await prisma.company.findFirst({
        where: {
          AND: [{ id: companyId }, { userId: session.user.id }],
        },
        select: { id: true },
      })

      if (!userCompany) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 })
      }
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "7d":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
    }

    // Get profile views within the date range
    const profileViews = await prisma.companyProfileView.findMany({
      where: {
        companyId: companyId,
        timestamp: {
          gte: startDate,
          lte: now,
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

    // Calculate demographics based on user type
    const userTypeCounts = profileViews.reduce((acc, view) => {
      const userType = view.user?.userType || "UNKNOWN"
      acc[userType] = (acc[userType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalViews = profileViews.length
    const demographics = Object.entries(userTypeCounts).map(([category, count]) => ({
      category,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
    }))

    // Group views by location
    const locationCounts = profileViews.reduce((acc, view) => {
      const location = view.location || "Unknown"
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const trafficSources = Object.entries(locationCounts)
      .map(([source, count]) => ({
        source,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)

    // Group views by hour of day
    const hourCounts = profileViews.reduce((acc, view) => {
      const hour = new Date(view.timestamp).getHours()
      const hourLabel = `${hour}:00`
      acc[hourLabel] = (acc[hourLabel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const timePatterns = Object.entries(hourCounts)
      .map(([hour, views]) => ({
        hour,
        views,
      }))
      .sort((a, b) => {
        const hourA = parseInt(a.hour.split(":")[0])
        const hourB = parseInt(b.hour.split(":")[0])
        return hourA - hourB
      })

    // Calculate behavior metrics
    // For now, we'll use placeholder data since we don't have detailed behavior tracking
    const behavior = [
      { action: "View Profile", count: totalViews },
      { action: "View Jobs", count: Math.round(totalViews * 0.7) },
      { action: "Save Company", count: Math.round(totalViews * 0.1) },
      { action: "Apply to Jobs", count: Math.round(totalViews * 0.05) },
    ]

    return NextResponse.json({
      demographics,
      behavior,
      trafficSources,
      timePatterns,
      period,
    })
  } catch (error) {
    console.error("Error fetching visitor insights:", error)
    return NextResponse.json({ error: "Failed to fetch visitor insights" }, { status: 500 })
  }
}