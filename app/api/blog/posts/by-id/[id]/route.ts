import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: { approved: true },
            },
            likes_rel: true,
          },
        },
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

    return NextResponse.json({
      ...post,
      userLiked,
    })
  } catch (error) {
    console.error("Error fetching blog post by ID:", error)
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 })
  }
}

// ADD THIS: Missing PUT method for editing posts
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      readTime,
      image,
      metaTitle,
      metaDescription,
      published = false,
      featured = false,
    } = body

    // Validate required fields
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            title: !title ? "Title is required" : null,
            excerpt: !excerpt ? "Excerpt is required" : null,
            content: !content ? "Content is required" : null,
            category: !category ? "Category is required" : null,
          },
        },
        { status: 400 },
      )
    }

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Update the post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        excerpt,
        content,
        category,
        tags: tags || [],
        readTime: readTime || Math.ceil(content.split(" ").length / 200),
        image,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        published,
        featured,
        publishedAt: published && !existingPost.published ? new Date() : existingPost.publishedAt,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error("Error updating blog post:", error)
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 })
  }
}

// ADD THIS: DELETE method for deleting posts
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { id } = params

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Delete related data first (comments, likes)
    await prisma.$transaction([
      prisma.blogComment.deleteMany({
        where: { postId: id },
      }),
      prisma.blogLike.deleteMany({
        where: { postId: id },
      }),
      prisma.blogPost.delete({
        where: { id },
      }),
    ])

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 })
  }
}
