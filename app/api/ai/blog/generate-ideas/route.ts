import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Generate Ideas API called")

    const session = await auth()
    console.log("🔐 Session check:", { hasUser: !!session?.user, userType: session?.user?.userType })

    if (!session?.user || session.user.userType !== "ADMIN") {
      console.log("❌ Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log("❌ OpenAI API key not found")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          details: "Please set OPENAI_API_KEY in your environment variables",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { keywords, niche } = body
    console.log("📝 Request data:", { keywords, niche })

    if (!keywords) {
      console.log("❌ Keywords missing")
      return NextResponse.json({ error: "Keywords are required" }, { status: 400 })
    }

    // Import AI SDK
    let generateText, openai
    try {
      const aiModule = await import("ai")
      const openaiModule = await import("@ai-sdk/openai")
      generateText = aiModule.generateText
      openai = openaiModule.openai
      console.log("✅ AI SDK imported successfully")
    } catch (importError) {
      console.error("❌ Failed to import AI SDK:", importError)
      return NextResponse.json(
        {
          error: "AI SDK import failed",
          details: importError instanceof Error ? importError.message : "Unknown import error",
        },
        { status: 500 },
      )
    }

    console.log("🤖 Starting AI generation...")

    const { text } = await generateText({
      model: openai("gpt-4o-mini"), // Using cheaper model
      system: `You are an expert content strategist specializing in ${niche || "career development and AI tools"}. Generate engaging, SEO-friendly blog post ideas that will attract job seekers and career-focused professionals.`,
      prompt: `Generate 5 unique blog post ideas based on these keywords: ${keywords}

For each idea, provide:
1. A compelling title (60 characters or less)
2. A brief excerpt (150 characters or less)
3. 3-5 relevant keywords
4. A category (Resume Tips, Job Search, Career Advice, Interview Tips, Remote Work, AI Tools, Industry Insights, or Salary Negotiation)
5. Difficulty level (Beginner, Intermediate, or Advanced)
6. Estimated read time (5-15 minutes)

Format as JSON array with this structure:
[
  {
    "title": "string",
    "excerpt": "string", 
    "keywords": ["string"],
    "category": "string",
    "difficulty": "string",
    "estimatedReadTime": number
  }
]

Make sure titles are actionable and benefit-focused. Focus on practical, valuable content that helps people advance their careers.`,
      maxTokens: 2000,
    })

    console.log("✅ AI generation completed, response length:", text.length)

    try {
      const ideas = JSON.parse(text)
      console.log("✅ JSON parsed successfully, ideas count:", ideas.length)

      // Validate the structure matches BlogIdea interface
      const validatedIdeas = ideas.map((idea: any) => ({
        title: idea.title || "Untitled",
        excerpt: idea.excerpt || "No description available",
        keywords: Array.isArray(idea.keywords) ? idea.keywords : [],
        category: idea.category || "General",
        difficulty: ["Beginner", "Intermediate", "Advanced"].includes(idea.difficulty) ? idea.difficulty : "Beginner",
        estimatedReadTime: typeof idea.estimatedReadTime === "number" ? idea.estimatedReadTime : 5,
      }))

      return NextResponse.json({ ideas: validatedIdeas })
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError)
      console.log("Raw AI response:", text)

      // Return fallback that matches your interface
      const fallbackIdeas = [
        {
          title: "Resume Optimization for 2024 Job Market",
          excerpt:
            "Learn proven strategies to make your resume stand out and pass ATS systems in today's competitive market.",
          keywords: ["resume", "ATS", "job search", "optimization"],
          category: "Resume Tips",
          difficulty: "Beginner" as const,
          estimatedReadTime: 8,
        },
        {
          title: "AI-Powered Job Search Strategies",
          excerpt:
            "Discover how to leverage AI tools to find better job opportunities and accelerate your career growth.",
          keywords: ["AI", "job search", "career", "technology"],
          category: "Career Advice",
          difficulty: "Intermediate" as const,
          estimatedReadTime: 10,
        },
      ]

      return NextResponse.json({
        ideas: fallbackIdeas,
        warning: "AI response parsing failed, using fallback content",
      })
    }
  } catch (error) {
    console.error("❌ Generate Ideas API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate blog ideas",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
