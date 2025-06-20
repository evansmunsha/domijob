import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { id: postId } = params

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user already liked this post
    const existingLike = await prisma.blogLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    })

    if (existingLike) {
      // Unlike the post
      await prisma.blogLike.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      })

      // Get updated like count
      const likeCount = await prisma.blogLike.count({
        where: { postId },
      })

      return NextResponse.json({
        liked: false,
        likeCount,
        message: "Post unliked",
      })
    } else {
      // Like the post
      await prisma.blogLike.create({
        data: {
          userId: session.user.id,
          postId: postId,
        },
      })

      // Get updated like count
      const likeCount = await prisma.blogLike.count({
        where: { postId },
      })

      return NextResponse.json({
        liked: true,
        likeCount,
        message: "Post liked",
      })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const { id: postId } = params

    // Get like count
    const likeCount = await prisma.blogLike.count({
      where: { postId },
    })

    // Check if current user liked this post
    let userLiked = false
    if (session?.user) {
      const existingLike = await prisma.blogLike.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      })
      userLiked = !!existingLike
    }

    return NextResponse.json({
      likeCount,
      userLiked,
    })
  } catch (error) {
    console.error("Error fetching like status:", error)
    return NextResponse.json({ error: "Failed to fetch like status" }, { status: 500 })
  }
}
