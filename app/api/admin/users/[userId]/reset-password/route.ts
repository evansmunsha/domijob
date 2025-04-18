import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth()
    
    // Check if the user is authenticated and is an admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Generate a password reset token
    // For now, we'll just mock this functionality since we're using NextAuth
    // In a real implementation, you'd use a service to send reset emails
    
    // Mock sending a password reset email
    console.log(`Password reset requested for user: ${user.email}`)
    
    return NextResponse.json({
      message: "Password reset email sent"
    })
  } catch (error) {
    console.error("[PASSWORD_RESET]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}