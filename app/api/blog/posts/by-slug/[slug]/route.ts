import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: {
        id: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        likes: true,
        _count: {
          select: {
            comments: {
              where: { approved: true },
            },
          },
        },
        title: true,
        content: true,
        slug: true,
        excerpt: true,
        category: true,
        tags: true,
        readTime: true,
        views: true,
        published: true,
        featured: true,
        image: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Don't show unpublished posts to non-admins
    const session = await auth()
    if (!post.published && (!session?.user || session.user.userType !== "ADMIN")) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if current user liked this post
    let userLiked = false
    if (session?.user) {
      const existingLike = await prisma.blogLike.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: post.id,
          },
        },
      })
      userLiked = !!existingLike
    }

    // Increment view count (optional)
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      ...post,
      userLiked,
    })
  } catch (error) {
    console.error("Error fetching blog post by slug:", error)
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 })
  }
}
