// app/api/blog/posts/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: {
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

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 })
  }
}

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
      slug,
      excerpt,
      content,
      category,
      tags,
      readTime,
      image,
      metaTitle,
      metaDescription,
      published,
      featured,
    } = body

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if slug is taken by another post
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      })

      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
      }
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title || existingPost.title,
        slug: slug || existingPost.slug,
        excerpt: excerpt || existingPost.excerpt,
        content: content || existingPost.content,
        category: category || existingPost.category,
        tags: tags || existingPost.tags,
        readTime: readTime || existingPost.readTime,
        image: image !== undefined ? image : existingPost.image,
        metaTitle: metaTitle || existingPost.metaTitle,
        metaDescription: metaDescription || existingPost.metaDescription,
        published: published !== undefined ? published : existingPost.published,
        featured: featured !== undefined ? featured : existingPost.featured,
        publishedAt: published && !existingPost.published ? new Date() : existingPost.publishedAt,
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { id } = params

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Delete the post (this will cascade delete comments and likes)
    await prisma.blogPost.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 })
  }
}
