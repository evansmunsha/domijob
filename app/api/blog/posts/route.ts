import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const featured = searchParams.get("featured") === "true"
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      published: true,
    }

    if (category) {
      where.category = category
    }

    if (tag) {
      where.tags = {
        has: tag
      }
    }

    if (featured) {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } }
      ]
    }

    // Get posts with author info
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              comments: {
                where: { approved: true }
              }
            }
          }
        },
        orderBy: [
          { featured: "desc" },
          { publishedAt: "desc" }
        ],
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ])

    // Get categories and tags for filters
    const categories = await prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true },
      _count: true
    })

    const allTags = await prisma.blogPost.findMany({
      where: { published: true },
      select: { tags: true }
    })

    const tagCounts = allTags.reduce((acc: Record<string, number>, post) => {
      post.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {})

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        categories: categories.map(c => ({
          name: c.category,
          count: c._count
        })),
        tags: Object.entries(tagCounts).map(([name, count]) => ({
          name,
          count
        }))
      }
    })
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

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
      published = false,
      featured = false
    } = body

    // Validate required fields
    if (!title || !slug || !excerpt || !content || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (existingPost) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      )
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
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
        authorId: session.user.id,
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

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating blog post:", error)
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    )
  }
}
