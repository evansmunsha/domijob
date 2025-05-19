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

    // Get potential candidate notifications
    const notifications = await prisma.companyNotification.findMany({
      where: {
        companyId: company.id,
        type: "POTENTIAL_CANDIDATE",
      },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: 50,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching potential candidates:", error)
    return NextResponse.json({ error: "Failed to fetch potential candidates" }, { status: 500 })
  }
}

