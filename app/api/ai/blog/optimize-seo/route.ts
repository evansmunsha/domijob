import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { auth } from "@/app/utils/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system:
        "You are an SEO expert specializing in career and job search content. Analyze content and provide actionable SEO recommendations.",
      prompt: `Analyze this blog post content for SEO optimization:

"${content}"

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
    })

    try {
      const suggestions = JSON.parse(text)
      return NextResponse.json({ suggestions })
    } catch (parseError) {
      console.error("Failed to parse SEO analysis:", parseError)
      return NextResponse.json({ error: "Failed to analyze content" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error optimizing content:", error)
    return NextResponse.json({ error: "Failed to optimize content" }, { status: 500 })
  }
}
