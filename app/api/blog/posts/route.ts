import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
import { sendEmail } from "@/app/utils/emailService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
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
        has: tag,
      }
    }

    if (featured) {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get posts with author info and counts
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
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
              likes_rel: true, // Use likes_rel instead of likes
            },
          },
        },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ])

    // Transform the data to include both like counts
    const transformedPosts = posts.map((post) => ({
      ...post,
      _count: {
        comments: post._count.comments,
        likes: post._count.likes_rel, // Map likes_rel count to likes for consistency
      },
    }))

    // Get categories and tags for filters
    const categories = await prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true },
      _count: true,
    })

    const allTags = await prisma.blogPost.findMany({
      where: { published: true },
      select: { tags: true },
    })

    const tagCounts = allTags.reduce((acc: Record<string, number>, post) => {
      post.tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {})

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        categories: categories.map((c) => ({
          name: c.category,
          count: c._count,
        })),
        tags: Object.entries(tagCounts).map(([name, count]) => ({
          name,
          count,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Blog post creation started...")

    const session = await auth()
    console.log("🔐 Session:", session?.user?.email, session?.user?.userType)

    if (!session?.user || session.user.userType !== "ADMIN") {
      console.log("❌ Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Request body received:", {
      title: body.title,
      slug: body.slug,
      category: body.category,
      published: body.published,
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
      featured = false,
    } = body

    // Validate required fields
    if (!title || !slug || !excerpt || !content || !category) {
      console.log("❌ Missing required fields:", {
        title: !!title,
        slug: !!slug,
        excerpt: !!excerpt,
        content: !!content,
        category: !!category,
      })
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            title: !title ? "Title is required" : null,
            slug: !slug ? "Slug is required" : null,
            excerpt: !excerpt ? "Excerpt is required" : null,
            content: !content ? "Content is required" : null,
            category: !category ? "Category is required" : null,
          },
        },
        { status: 400 },
      )
    }

    // Check if slug already exists
    console.log("🔍 Checking if slug exists:", slug)
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    })

    if (existingPost) {
      console.log("❌ Slug already exists:", slug)
      return NextResponse.json({ error: "Slug already exists. Please choose a different URL slug." }, { status: 400 })
    }

    console.log("📝 Creating blog post...")
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
        publishedAt: published ? new Date() : null,
      },
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

    console.log("✅ Blog post created successfully:", post.id)

    // Transform the response to include both like counts
    const transformedPost = {
      ...post,
      _count: {
        comments: post._count.comments,
        likes: post._count.likes_rel,
      },
    }

    // 🚀 NEW: Send newsletter notification if published
    if (published) {
      console.log("📧 Post is published, sending newsletter notifications...")

      // Don't await this - let it run in background
      sendNewsletterNotification(post).catch((error) => {
        console.error("❌ Newsletter notification failed (non-critical):", error)
      })
    }

    return NextResponse.json(transformedPost, { status: 201 })
  } catch (error) {
    console.error("❌ Error creating blog post:", error)

    // Provide more specific error messages
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A blog post with this slug already exists" }, { status: 400 })
    }
    if (error.code === "P2021") {
      return NextResponse.json(
        { error: "Database table does not exist. Please run database migration." },
        { status: 500 },
      )
    }
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ error: "Database tables not found. Please run: npx prisma db push" }, { status: 500 })
    }

    return NextResponse.json(
      {
        error: "Failed to create blog post",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// 🚀 NEW: Newsletter notification function
async function sendNewsletterNotification(post: any) {
  try {
    console.log("📬 Preparing newsletter for post:", post.title)

    // Get all active newsletter subscribers who want blog updates
    const subscribers = await prisma.newsletterSubscription.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { preferences: { path: ["weeklyDigest"], equals: true } },
          { preferences: { path: ["careerTips"], equals: true } },
        ],
      },
      select: {
        email: true,
        preferences: true,
      },
    })

    console.log(`📊 Found ${subscribers.length} active subscribers`)

    if (subscribers.length === 0) {
      console.log("ℹ️ No subscribers to notify")
      return
    }

    // Create email content with AI tool promotions
    const emailHtml = createBlogNotificationEmail(post)
    const emailSubject = `📚 New Career Insights: ${post.title}`

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 50
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)

      const emailPromises = batch.map(async (subscriber) => {
        try {
          // Personalize the email by replacing placeholders
          const personalizedHtml = emailHtml.replace(/{{email}}/g, subscriber.email)

          await sendEmail(subscriber.email, emailSubject, personalizedHtml)
          console.log(`✅ Email sent to: ${subscriber.email}`)
          successCount++
        } catch (error) {
          console.error(`❌ Failed to send email to ${subscriber.email}:`, error)
          errorCount++
        }
      })

      await Promise.allSettled(emailPromises)

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log(`🎉 Newsletter notifications completed: ${successCount} sent, ${errorCount} failed`)
  } catch (error) {
    console.error("❌ Newsletter notification error:", error)
    throw error
  }
}

function createBlogNotificationEmail(post: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://domijob.vercel.app"

  // Get relevant AI tools based on post content
  const getRelevantTools = () => {
    const contentLower = (post.title + post.content + post.category).toLowerCase()

    if (contentLower.includes("resume") || contentLower.includes("cv")) {
      return [
        {
          title: "✨ AI Resume Enhancer",
          description: "Optimize your resume for ATS systems and recruiters",
          href: `${baseUrl}/ai-tools/resume-enhancer`,
        },
        {
          title: "🎯 Smart Job Matching",
          description: "Find jobs that perfectly match your skills",
          href: `${baseUrl}/jobs`,
        },
      ]
    }
    if (contentLower.includes("interview")) {
      return [
        {
          title: "💼 Interview Prep AI",
          description: "Practice interviews with AI-powered feedback",
          href: `${baseUrl}/ai-tools/interview-prep`,
        },
        {
          title: "✨ AI Resume Enhancer",
          description: "Perfect your resume before the interview",
          href: `${baseUrl}/ai-tools/resume-enhancer`,
        },
      ]
    }
    if (contentLower.includes("salary") || contentLower.includes("negotiat")) {
      return [
        {
          title: "💰 Salary Negotiator",
          description: "Get data-driven salary insights and negotiation tips",
          href: `${baseUrl}/ai-tools/salary-negotiator`,
        },
        {
          title: "🎯 Smart Job Matching",
          description: "Find high-paying opportunities",
          href: `${baseUrl}/jobs`,
        },
      ]
    }

    // Default tools
    return [
      {
        title: "✨ AI Resume Enhancer",
        description: "Optimize your resume for better results",
        href: `${baseUrl}/ai-tools/resume-enhancer`,
      },
      {
        title: "🎯 Smart Job Matching",
        description: "Discover your perfect career opportunity",
        href: `${baseUrl}/jobs`,
      },
    ]
  }

  const relevantTools = getRelevantTools()

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Blog Post - ${post.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📚 New Career Insights</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Fresh from the DomiJob Blog</p>
      </div>
      
      <!-- Main Content -->
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #333; margin-top: 0; font-size: 22px; line-height: 1.3;">${post.title}</h2>
        
        <p style="color: #666; font-size: 16px; margin-bottom: 20px; line-height: 1.5;">${post.excerpt}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            📖 <strong>${post.readTime || 5} min read</strong> • 
            🏷️ <strong>${post.category}</strong>
          </p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/blog/${post.slug}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            Read Full Article →
          </a>
        </div>
        
        <!-- AI Tools Promotion -->
        <div style="background: linear-gradient(135deg, #667eea10 0%, #764ba220 100%); padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #667eea; font-size: 18px; text-align: center;">🚀 Accelerate Your Career with AI</h3>
          <p style="margin-bottom: 20px; font-size: 14px; text-align: center; color: #666;">While you're here, don't miss our powerful AI tools:</p>
          
          <div style="display: block;">
            ${relevantTools
              .map(
                (tool) => `
              <a href="${tool.href}" 
                 style="display: block; padding: 15px; background: white; border: 2px solid #667eea; border-radius: 8px; text-decoration: none; color: #333; margin-bottom: 10px; transition: all 0.3s;">
                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px;">${tool.title}</div>
                <div style="font-size: 13px; color: #666;">${tool.description}</div>
              </a>
            `,
              )
              .join("")}
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${baseUrl}/ai-tools" 
               style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500;">
              View All AI Tools →
            </a>
          </div>
        </div>
        
        <!-- Newsletter CTA -->
        <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #333;">💡 Want More Career Tips?</h4>
          <p style="margin-bottom: 15px; font-size: 14px; color: #666;">Get weekly insights delivered to your inbox</p>
          <a href="${baseUrl}/blog" 
             style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: 500;">
            Read More Articles
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 10px 0;">You're receiving this because you subscribed to DomiJob career updates.</p>
        <p style="margin: 0;">
          <a href="${baseUrl}/newsletter/unsubscribe?email={{email}}" style="color: #667eea;">Unsubscribe</a> | 
          <a href="${baseUrl}/newsletter/preferences?email={{email}}" style="color: #667eea;">Update Preferences</a> |
          <a href="${baseUrl}/blog" style="color: #667eea;">View All Posts</a>
        </p>
      </div>
    </body>
    </html>
  `
}
