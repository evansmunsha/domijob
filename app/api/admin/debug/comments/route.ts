import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET() {
  try {
    console.log("🔍 Debug Comments API: Starting...")

    const session = await auth()
    console.log("🔐 Debug Comments API: Session:", {
      hasUser: !!session?.user,
      userType: session?.user?.userType,
      userId: session?.user?.id,
    })

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Get basic stats
    const [totalComments, approvedComments, pendingComments, totalPosts] = await Promise.all([
      prisma.blogComment.count(),
      prisma.blogComment.count({ where: { approved: true } }),
      prisma.blogComment.count({ where: { approved: false } }),
      prisma.blogPost.count(),
    ])

    // Get sample comments
    const sampleComments = await prisma.blogComment.findMany({
      take: 5,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get all comments with full details
    const allComments = await prisma.blogComment.findMany({
      where: {
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    })

    const debugInfo = {
      timestamp: new Date().toISOString(),
      session: {
        hasUser: !!session?.user,
        userType: session?.user?.userType,
        userId: session?.user?.id,
      },
      stats: {
        totalComments,
        approvedComments,
        pendingComments,
        totalPosts,
      },
      sampleComments: sampleComments.map((comment) => ({
        id: comment.id,
        content: comment.content.substring(0, 100) + "...",
        approved: comment.approved,
        author: comment.author?.name || "Anonymous",
        post: comment.post?.title || "No Post",
        createdAt: comment.createdAt.toISOString(),
      })),
      allComments: allComments.map((comment) => ({
        id: comment.id,
        content: comment.content.substring(0, 100) + "...",
        approved: comment.approved,
        author: comment.author?.name || "Anonymous",
        post: comment.post?.title || "No Post",
        replies: comment.replies?.length || 0,
        createdAt: comment.createdAt.toISOString(),
      })),
    }

    console.log("✅ Debug Comments API: Success", debugInfo.stats)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("❌ Debug Comments API: Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch debug info",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}






/* import { NextResponse } from "next/server"
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
 */