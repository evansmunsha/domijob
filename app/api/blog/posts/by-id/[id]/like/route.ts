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

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already liked this post
      const existingLike = await tx.blogLike.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      })

      if (existingLike) {
        // Unlike the post - remove from BlogLike table and decrement likes field
        await tx.blogLike.delete({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId: postId,
            },
          },
        })

        // Decrement the likes field in BlogPost
        await tx.blogPost.update({
          where: { id: postId },
          data: {
            likes: {
              decrement: 1,
            },
          },
        })

        // Get updated like count from both sources
        const [likeCount, updatedPost] = await Promise.all([
          tx.blogLike.count({
            where: { postId },
          }),
          tx.blogPost.findUnique({
            where: { id: postId },
            select: { likes: true },
          }),
        ])

        return {
          liked: false,
          likeCount: updatedPost?.likes || 0, // Use the likes field from BlogPost
          message: "Post unliked",
        }
      } else {
        // Like the post - add to BlogLike table and increment likes field
        await tx.blogLike.create({
          data: {
            userId: session.user.id,
            postId: postId,
          },
        })

        // Increment the likes field in BlogPost
        await tx.blogPost.update({
          where: { id: postId },
          data: {
            likes: {
              increment: 1,
            },
          },
        })

        // Get updated like count from both sources
        const [likeCount, updatedPost] = await Promise.all([
          tx.blogLike.count({
            where: { postId },
          }),
          tx.blogPost.findUnique({
            where: { id: postId },
            select: { likes: true },
          }),
        ])

        return {
          liked: true,
          likeCount: updatedPost?.likes || 0, // Use the likes field from BlogPost
          message: "Post liked",
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const { id: postId } = params

    // Get like count from the BlogPost likes field and user like status
    const [post, userLike] = await Promise.all([
      prisma.blogPost.findUnique({
        where: { id: postId },
        select: { likes: true },
      }),
      session?.user
        ? prisma.blogLike.findUnique({
            where: {
              userId_postId: {
                userId: session.user.id,
                postId: postId,
              },
            },
          })
        : null,
    ])

    return NextResponse.json({
      likeCount: post?.likes || 0, // Use the likes field from BlogPost
      userLiked: !!userLike,
    })
  } catch (error) {
    console.error("Error fetching like status:", error)
    return NextResponse.json({ error: "Failed to fetch like status" }, { status: 500 })
  }
}
