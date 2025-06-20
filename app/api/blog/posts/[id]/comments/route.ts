// app/api/blog/posts/[id]/comments/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
import { z } from "zod"

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
  parentId: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { id: postId } = params
    const body = await request.json()
    const { content, parentId } = commentSchema.parse(body)

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    // Check if parent comment exists (for replies)
    if (parentId) {
      const parentComment = await prisma.blogComment.findUnique({
        where: { id: parentId }
      })

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    // Create comment
    const comment = await prisma.blogComment.create({
      data: {
        content,
        postId,
        authorId: session.user.id,
        parentId: parentId || null,
        approved: false // Comments need approval
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        replies: {
          where: { approved: true },
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
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params

    const comments = await prisma.blogComment.findMany({
      where: {
        postId,
        approved: true,
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
        replies: {
          where: { approved: true },
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
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}
