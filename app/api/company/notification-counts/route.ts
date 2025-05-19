import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const url = new URL(req.url)
    const queryCompanyId = url.searchParams.get("companyId")

    console.log("Notification counts request:", {
      authenticated: !!session?.user?.id,
      userType: session?.user?.userType,
      queryCompanyId,
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a company or allow access if they provide a valid companyId
    if (session.user.userType !== "COMPANY" && !queryCompanyId) {
      return NextResponse.json({ error: "Only companies can access this endpoint" }, { status: 403 })
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

    console.log(`Fetching notification counts for company: ${companyId}`)

    // Get total unread notifications
    const total = await prisma.companyNotification.count({
      where: {
        companyId,
        read: false,
      },
    })

    // Get counts by notification type
    const typeCounts = await prisma.companyNotification.groupBy({
      by: ["type"],
      where: {
        companyId,
        read: false,
      },
      _count: true,
    })

    // Format the counts by type
    const byType = {
      NEW_APPLICATION: 0,
      APPLICATION_STATUS_UPDATED: 0,
      PROFILE_VIEWS: 0,
      POTENTIAL_CANDIDATE: 0,
    }

    typeCounts.forEach((count) => {
      if (count.type in byType) {
        byType[count.type as keyof typeof byType] = count._count
      }
    })

    console.log(`Notification counts for company ${companyId}:`, { total, byType })

    return NextResponse.json({
      total,
      byType,
    })
  } catch (error) {
    console.error("Error fetching notification counts:", error)
    return NextResponse.json({ error: "Failed to fetch notification counts" }, { status: 500 })
  }
}

