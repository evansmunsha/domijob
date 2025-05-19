import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST() {
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
    
    // Update all unread notifications to read
    await prisma.companyNotification.updateMany({
      where: { 
        companyId: company.id,
        read: false
      },
      data: {
        read: true
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 