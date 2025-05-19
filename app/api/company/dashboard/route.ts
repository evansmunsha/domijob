import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a company
    if (session.user.userType !== "COMPANY") {
      return NextResponse.json({ error: "Only companies can access this endpoint" }, { status: 403 })
    }

    // Get the company ID
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 })
    }

    // Get recent applications
    const recentApplications = await prisma.jobApplication.findMany({
      where: {
        job: {
          companyId: company.id,
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
            JobSeeker: {
              select: {
                name: true,
                skills: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    // Get application statistics
    const applicationStats = await prisma.jobApplication.groupBy({
      by: ["status"],
      where: {
        job: {
          companyId: company.id,
        },
      },
      _count: true,
    })

    // Format the stats
    const stats = {
      total: 0,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    }

    applicationStats.forEach((stat) => {
      const status = stat.status.toLowerCase()
      if (status in stats) {
        stats[status as keyof typeof stats] = stat._count
        stats.total += stat._count
      }
    })

    // Get unread notification count
    const unreadNotifications = await prisma.companyNotification.count({
      where: {
        companyId: company.id,
        read: false,
      },
    })

    // Log the dashboard access
    console.log(`Company ${company.id} accessed dashboard. Unread notifications: ${unreadNotifications}`)

    return NextResponse.json({
      recentApplications,
      stats,
      unreadNotifications,
    })
  } catch (error) {
    console.error("Error fetching company dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

