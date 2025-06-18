import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET() {
  try {
    // First check if user is admin
    const session = await auth()
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get comments with related data
    const comments = await prisma.blogComment.findMany({
      take: 50, // Get up to 50 comments for debugging
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get counts for different statuses
    const totalCount = await prisma.blogComment.count()
    const approvedCount = await prisma.blogComment.count({ where: { approved: true }})
    const pendingCount = await prisma.blogComment.count({ where: { approved: false }})

    return NextResponse.json({
      success: true,
      counts: {
        total: totalCount,
        approved: approvedCount,
        pending: pendingCount
      },
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        approved: c.approved,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        parentId: c.parentId,
        author: c.author,
        post: c.post
      }))
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch comments",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
