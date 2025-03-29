import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { logger } from "@/app/utils/logger"

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get URL parameters
    const url = new URL(req.url)
    const periodParam = url.searchParams.get("period") || "week"
    const companyId = url.searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Verify the user has access to this company's data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        Company: true,
      },
    })

    // Only allow access if the user is associated with the company
    if (user?.Company?.id !== companyId) {
      return NextResponse.json({ error: "Unauthorized to access this company's data" }, { status: 403 })
    }

    // Determine date range based on period
    const now = new Date()
    let startDate: Date

    switch (periodParam) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case "week":
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
        startDate = new Date(now.setDate(diff))
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.setDate(now.getDate() - 7))
    }

    logger.debug(`Fetching profile views for company ${companyId} from ${startDate.toISOString()}`)

    // Query profile views for the company within the date range
    const profileViews = await prisma.companyProfileView.findMany({
      where: {
        companyId: companyId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    // Calculate total views
    const totalViews = profileViews.length

    // Process data for chart based on period
    let data: Array<{ label: string; views: number }> = []
    const locationMap = new Map<string, number>()

    if (periodParam === "day") {
      // Group by hour for day view
      const hourlyData = new Map<string, number>()

      // Initialize hours
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, "0")
        hourlyData.set(`${hour}:00`, 0)
      }

      // Count views by hour
      profileViews.forEach((view) => {
        const hour = new Date(view.timestamp).getHours().toString().padStart(2, "0")
        hourlyData.set(`${hour}:00`, (hourlyData.get(`${hour}:00`) || 0) + 1)

        // Track locations
        locationMap.set(view.location, (locationMap.get(view.location) || 0) + 1)
      })

      data = Array.from(hourlyData.entries()).map(([label, views]) => ({ label, views }))
    } else if (periodParam === "week") {
      // Group by day for week view
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      const dailyData = new Map<string, number>()

      // Initialize days
      dayNames.forEach((day) => {
        dailyData.set(day, 0)
      })

      // Count views by day
      profileViews.forEach((view) => {
        const dayIndex = new Date(view.timestamp).getDay()
        // Convert from Sunday=0 to Monday=0 format
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1
        const dayName = dayNames[adjustedIndex]
        dailyData.set(dayName, (dailyData.get(dayName) || 0) + 1)

        // Track locations
        locationMap.set(view.location, (locationMap.get(view.location) || 0) + 1)
      })

      data = Array.from(dailyData.entries()).map(([label, views]) => ({ label, views }))
    } else if (periodParam === "month") {
      // Group by date for month view
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const dailyData = new Map<string, number>()

      // Initialize days
      for (let i = 1; i <= daysInMonth; i++) {
        const date = i.toString().padStart(2, "0")
        dailyData.set(date, 0)
      }

      // Count views by date
      profileViews.forEach((view) => {
        const date = new Date(view.timestamp).getDate().toString().padStart(2, "0")
        dailyData.set(date, (dailyData.get(date) || 0) + 1)

        // Track locations
        locationMap.set(view.location, (locationMap.get(view.location) || 0) + 1)
      })

      data = Array.from(dailyData.entries()).map(([label, views]) => ({ label, views }))
    }

    // Format location data and sort by views (descending)
    const locations = Array.from(locationMap.entries())
      .map(([location, views]) => ({ location, views }))
      .sort((a, b) => b.views - a.views)

    return NextResponse.json({
      data,
      locations,
      period: periodParam,
      totalViews,
    })
  } catch (error) {
    logger.error("Error fetching profile views analytics:", error)
    return NextResponse.json({ error: "Failed to fetch profile views analytics" }, { status: 500 })
  }
}

