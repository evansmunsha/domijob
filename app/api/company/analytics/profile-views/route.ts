import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const url = new URL(req.url)
    const period = url.searchParams.get("period") || "week"
    const queryCompanyId = url.searchParams.get("companyId")

    console.log("Profile views analytics request:", {
      authenticated: !!session?.user?.id,
      userType: session?.user?.userType,
      period,
      queryCompanyId,
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the company ID - either from query param or from the session
    let companyId: string | null = null

    if (queryCompanyId) {
      // If companyId is provided in query, use it (but verify user has access if they're a company user)
      if (session.user.userType === "COMPANY") {
        const userCompany = await prisma.company.findFirst({
          where: {
            AND: [{ id: queryCompanyId }, { userId: session.user.id }],
          },
          select: { id: true },
        })

        if (userCompany) {
          companyId = userCompany.id
        }
      } else {
        // For non-company users (like admins), just use the provided companyId
        companyId = queryCompanyId
      }
    }

    // If no valid companyId from query, get it from the session (for company users)
    if (!companyId && session.user.userType === "COMPANY") {
      const company = await prisma.company.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      if (!company) {
        console.error("Company profile not found for user:", session.user.id)
        return NextResponse.json({ error: "Company profile not found" }, { status: 404 })
      }

      companyId = company.id
    }

    if (!companyId) {
      console.error("No valid companyId could be determined")
      return NextResponse.json({ error: "No valid company ID provided" }, { status: 400 })
    }

    console.log(`Fetching profile views for company: ${companyId}, period: ${period}`)

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case "week":
        const day = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - day)
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
    }

    // Check if there are any profile views for this company
    const viewsExist = await prisma.companyProfileView.findFirst({
      where: {
        companyId: companyId,
      },
    })

    // If no views exist, return empty data with proper structure
    if (!viewsExist) {
      console.log(`No profile views found for company: ${companyId}`)

      // Return empty data with the expected structure
      let emptyData
      if (period === "day") {
        emptyData = Array.from({ length: 24 }, (_, i) => ({
          label: `${i}:00`,
          views: 0,
        }))
      } else if (period === "week") {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        emptyData = dayNames.map((day) => ({
          label: day,
          views: 0,
        }))
      } else {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        emptyData = Array.from({ length: daysInMonth }, (_, i) => ({
          label: `${i + 1}`,
          views: 0,
        }))
      }

      return NextResponse.json({
        data: emptyData,
        locations: [],
        period,
        totalViews: 0,
      })
    }

    // Format data based on period
    type RawViewData = { hour?: number; day?: number; views: bigint | number }
    type ChartDataPoint = { label: string; views: number }

    let rawData: RawViewData[] = []
    let data: ChartDataPoint[] = []

    try {
      if (period === "day") {
        // Group by hour for day view
        rawData = await prisma.$queryRaw`
          SELECT EXTRACT(HOUR FROM "timestamp") as hour, COUNT(*) as views
          FROM "CompanyProfileView"
          WHERE "companyId" = ${companyId}
          AND "timestamp" >= ${startDate}
          GROUP BY EXTRACT(HOUR FROM "timestamp")
          ORDER BY hour
        `

        // Format hours data
        data = Array.from({ length: 24 }, (_, i) => {
          const hourData = rawData.find((h) => Number(h.hour) === i)
          return {
            label: `${i}:00`,
            views: hourData ? Number(hourData.views) : 0,
          }
        })
      } else if (period === "week") {
        // Group by day for week view
        rawData = await prisma.$queryRaw`
          SELECT EXTRACT(DOW FROM "timestamp") as day, COUNT(*) as views
          FROM "CompanyProfileView"
          WHERE "companyId" = ${companyId}
          AND "timestamp" >= ${startDate}
          GROUP BY EXTRACT(DOW FROM "timestamp")
          ORDER BY day
        `

        // Format days data
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        data = Array.from({ length: 7 }, (_, i) => {
          const dayData = rawData.find((d) => Number(d.day) === i)
          return {
            label: dayNames[i],
            views: dayData ? Number(dayData.views) : 0,
          }
        })
      } else {
        // Group by day for month view
        rawData = await prisma.$queryRaw`
          SELECT EXTRACT(DAY FROM "timestamp") as day, COUNT(*) as views
          FROM "CompanyProfileView"
          WHERE "companyId" = ${companyId}
          AND "timestamp" >= ${startDate}
          GROUP BY EXTRACT(DAY FROM "timestamp")
          ORDER BY day
        `

        // Format days data
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        data = Array.from({ length: daysInMonth }, (_, i) => {
          const dayData = rawData.find((d) => Number(d.day) === i + 1)
          return {
            label: `${i + 1}`,
            views: dayData ? Number(dayData.views) : 0,
          }
        })
      }
    } catch (error) {
      console.error("Error executing raw query:", error)
      // Fallback to a simpler query if raw query fails
      const views = await prisma.companyProfileView.findMany({
        where: {
          companyId: companyId,
          timestamp: {
            gte: startDate,
          },
        },
      })

      // Create a simple count by day
      const viewsByDay = new Map()
      views.forEach((view) => {
        const day = view.timestamp.getDate()
        viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1)
      })

      data = Array.from(viewsByDay.entries())
        .map(([day, count]) => ({
          label: String(day),
          views: count,
        }))
        .sort((a, b) => Number(a.label) - Number(b.label))
    }

    // Get location data
    const locations = await prisma.companyProfileView.groupBy({
      by: ["location"],
      where: {
        companyId: companyId,
        timestamp: {
          gte: startDate,
        },
      },
      _count: true,
    })

    const locationData = locations
      .map((loc) => ({
        location: loc.location || "Unknown",
        views: loc._count,
      }))
      .sort((a, b) => b.views - a.views)

    const totalViews = data.reduce((sum, item) => sum + item.views, 0)

    console.log(`Successfully fetched profile views for company ${companyId}:`, {
      totalViews,
      locationCount: locationData.length,
    })

    return NextResponse.json({
      data,
      locations: locationData,
      period,
      totalViews,
    })
  } catch (error) {
    console.error("Error fetching profile views analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

