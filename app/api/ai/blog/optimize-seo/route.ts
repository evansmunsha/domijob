import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 SEO Optimization API called")

    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
        },
        { status: 500 },
      )
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Import AI SDK
    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "You are an SEO expert specializing in career and job search content. Analyze content and provide actionable SEO recommendations.",
      prompt: `Analyze this blog post content for SEO optimization:

"${content.substring(0, 2000)}" ${content.length > 2000 ? "...(truncated)" : ""}

Provide analysis in JSON format:
{
  "score": number (0-100),
  "readability": "Easy" | "Medium" | "Hard",
  "keywords": ["extracted", "keywords"],
  "recommendations": [
    "specific actionable recommendations"
  ],
  "metaTitle": "optimized meta title (60 chars)",
  "metaDescription": "optimized meta description (160 chars)"
}

Focus on:
- Keyword density and placement
- Content structure and headings
- Readability and engagement
- Meta optimization
- Career/job search relevance`,
      maxTokens: 1000,
    })

    try {
      const suggestions = JSON.parse(text)
      return NextResponse.json({ suggestions })
    } catch (parseError) {
      console.error("❌ Failed to parse SEO analysis:", parseError)

      // Return fallback SEO analysis
      const fallbackSuggestions = {
        score: 75,
        readability: "Medium",
        keywords: ["career", "job search", "professional"],
        recommendations: [
          "Add more relevant keywords throughout the content",
          "Include subheadings for better structure",
          "Add a clear call-to-action at the end",
        ],
        metaTitle: content.split("\n")[0]?.replace("#", "").trim().substring(0, 60) || "Career Tips",
        metaDescription: "Learn valuable career tips and strategies to advance your professional journey.",
      }

      return NextResponse.json({
        suggestions: fallbackSuggestions,
        warning: "AI response parsing failed, using fallback analysis",
      })
    }
  } catch (error) {
    console.error("❌ SEO Optimization API error:", error)
    return NextResponse.json(
      {
        error: "Failed to optimize content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
