import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function PATCH(
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
    
    // Get the role from the request body
    const { role } = await req.json()
    
    // Validate the role
    if (!["ADMIN", "COMPANY", "JOB_SEEKER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
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
    
    // Update the user role
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { userType: role }
    })
    
    return NextResponse.json({
      message: `User role updated to ${role}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        userType: updatedUser.userType
      }
    })
  } catch (error) {
    console.error("[USER_ROLE_UPDATE]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}