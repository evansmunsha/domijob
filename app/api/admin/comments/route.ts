//app/api/admin/comments/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const comments = await prisma.blogComment.findMany({
      where: {
        parentId: null // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: [
        { approved: "asc" },
        { createdAt: "desc" }
      ]
    })

    // Serialize the comments
    const serializedComments = comments.map(comment => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      replies: comment.replies.map(reply => ({
        ...reply,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString()
      }))
    }))

    return NextResponse.json({
      comments: serializedComments,
      stats: {
        total: comments.length,
        approved: comments.filter(c => c.approved).length,
        pending: comments.filter(c => !c.approved).length,
        totalReplies: comments.reduce((sum, comment) => sum + (comment._count?.replies ?? 0), 0)
      }
    })
  } catch (error) {
    console.error("Error fetching admin comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
} 