import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const commentCount = await prisma.blogComment.count()
    const comments = await prisma.blogComment.findMany({
      take: 5,
      select: {
        id: true,
        content: true,
        approved: true,
        author: {
          select: {
            name: true,
            email: true
          }
        },
        post: {
          select: {
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      commentCount,
      sampleComments: comments,
      message: "Database connection successful"
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Database connection failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
