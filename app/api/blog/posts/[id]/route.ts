import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id } = params

    // Check if user is admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // Fetch the post
    const post = await prisma.blogPost.findUnique({
      where: { id },
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
            parentId: null
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

    return NextResponse.json(post)
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id } = params

    // Check if user is admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

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
      published,
      featured
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
            category: !category ? "Category is required" : null
          }
        },
        { status: 400 }
      )
    }

    // Update the post
    const post = await prisma.blogPost.update({
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
        publishedAt: published ? new Date() : null
      },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id } = params

    // Check if user is admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // Delete the post
    await prisma.blogPost.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    )
  }
} 