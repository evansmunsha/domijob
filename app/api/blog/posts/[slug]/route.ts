import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        comments: {
          where: { 
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
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    if (!post.published) {
      const session = await auth()
      if (!session?.user || session.user.userType !== "ADMIN") {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        )
      }
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } }
    })

    // Get related posts
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        published: true,
        category: post.category,
        id: { not: post.id }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      take: 3,
      orderBy: { publishedAt: "desc" }
    })

    return NextResponse.json({
      ...post,
      relatedPosts
    })
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { slug } = params
    const body = await request.json()

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

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
      published,
      featured
    } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) {
      updateData.content = content
      updateData.readTime = readTime || Math.ceil(content.split(" ").length / 200)
    }
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (image !== undefined) updateData.image = image
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (featured !== undefined) updateData.featured = featured

    // Handle publishing
    if (published !== undefined) {
      updateData.published = published
      if (published && !existingPost.publishedAt) {
        updateData.publishedAt = new Date()
      } else if (!published) {
        updateData.publishedAt = null
      }
    }

    const post = await prisma.blogPost.update({
      where: { slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error updating blog post:", error)
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { slug } = params

    const post = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    await prisma.blogPost.delete({
      where: { slug }
    })

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    )
  }
}
