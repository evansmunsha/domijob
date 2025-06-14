import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id: postId } = params

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

    let likes = post.likes || 0

    if (session?.user) {
      // For authenticated users, track individual likes
      const existingLike = await prisma.blogLike?.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId
          }
        }
      }).catch(() => null) // Handle if BlogLike model doesn't exist

      if (existingLike) {
        // Unlike
        await prisma.blogLike?.delete({
          where: { id: existingLike.id }
        }).catch(() => {})
        likes = Math.max(0, likes - 1)
      } else {
        // Like
        await prisma.blogLike?.create({
          data: {
            userId: session.user.id,
            postId
          }
        }).catch(() => {})
        likes += 1
      }
    } else {
      // For anonymous users, just increment
      likes += 1
    }

    // Update post likes count
    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: { likes }
    })

    return NextResponse.json({ 
      likes: updatedPost.likes,
      isLiked: session?.user ? !existingLike : false
    })
  } catch (error) {
    console.error("Error handling like:", error)
    
    // Fallback: just increment likes without user tracking
    try {
      const updatedPost = await prisma.blogPost.update({
        where: { id: params.id },
        data: { 
          likes: {
            increment: 1
          }
        }
      })
      
      return NextResponse.json({ 
        likes: updatedPost.likes,
        isLiked: true
      })
    } catch (fallbackError) {
      console.error("Fallback like error:", fallbackError)
      return NextResponse.json(
        { error: "Failed to like post" },
        { status: 500 }
      )
    }
  }
}
