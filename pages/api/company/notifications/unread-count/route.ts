import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.userType !== "COMPANY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Get the company
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    
    // Count unread notifications
    const unreadCount = await prisma.companyNotification.count({
      where: { 
        companyId: company.id,
        read: false
      },
    })
    
    return NextResponse.json({ count: unreadCount })
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 