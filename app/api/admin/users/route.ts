import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    
    // Check if the user is authenticated and is an admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Get the search query from the URL
    const url = new URL(req.url)
    const search = url.searchParams.get('q') || ''
    
    // Fetch users with search filter
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        userType: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error("[USERS_GET]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    // Check if the user is authenticated and is an admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Get the user data from the request body
    const userData = await req.json()
    
    // Validate the required fields
    if (!userData.email || !userData.name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      )
    }
    
    // Check if the email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }
    
    // Create the user
    // Note: In a real implementation, you would want to hash the password
    // and possibly send an email to the user to set their password
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        userType: userData.userType || "JOB_SEEKER",
      }
    })
    
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.userType
      }
    }, { status: 201 })
  } catch (error) {
    console.error("[USER_CREATE]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}