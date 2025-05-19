import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function DELETE(
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
    
    // Don't allow deleting yourself
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }
    
    // Delete the user
    await prisma.user.delete({
      where: { id: params.userId }
    })
    
    return NextResponse.json({
      message: "User deleted successfully"
    })
  } catch (error) {
    console.error("[USER_DELETE]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET(
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
    
    // Get the user with related data
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        Company: true,
        JobSeeker: true,
        affiliate: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error("[USER_GET]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}