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
    console.log("Blog post creation started...")

    const session = await auth()
    console.log("Session:", session?.user?.email, session?.user?.userType)

    if (!session?.user || session.user.userType !== "ADMIN") {
      console.log("Unauthorized access attempt")
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log("Request body received:", {
      title: body.title,
      slug: body.slug,
      category: body.category,
      published: body.published
    })

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
      console.log("Missing required fields:", { title: !!title, slug: !!slug, excerpt: !!excerpt, content: !!content, category: !!category })
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            title: !title ? "Title is required" : null,
            slug: !slug ? "Slug is required" : null,
            excerpt: !excerpt ? "Excerpt is required" : null,
            content: !content ? "Content is required" : null,
            category: !category ? "Category is required" : null
          }
        },
        { status: 400 }
      )
    }

    // Check if slug already exists
    console.log("Checking if slug exists:", slug)
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (existingPost) {
      console.log("Slug already exists:", slug)
      return NextResponse.json(
        { error: "Slug already exists. Please choose a different URL slug." },
        { status: 400 }
      )
    }

    console.log("Creating blog post...")
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

    console.log("Blog post created successfully:", post.id)
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating blog post:", error)

    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A blog post with this slug already exists" },
        { status: 400 }
      )
    } else if (error.code === 'P2021') {
      return NextResponse.json(
        { error: "Database table does not exist. Please run database migration." },
        { status: 500 }
      )
    } else if (error.message.includes('does not exist')) {
      return NextResponse.json(
        { error: "Database tables not found. Please run: npx prisma db push" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create blog post",
        details: error.message
      },
      { status: 500 }
    )
  }
}
