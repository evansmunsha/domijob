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

    const { keywords, niche } = await request.json()

    if (!keywords) {
      return NextResponse.json({ error: "Keywords are required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert content strategist specializing in ${niche}. Generate engaging, SEO-friendly blog post ideas that will attract job seekers and career-focused professionals.`,
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
    })

    try {
      const ideas = JSON.parse(text)
      return NextResponse.json({ ideas })
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json({ error: "Failed to generate structured ideas" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating blog ideas:", error)
    return NextResponse.json({ error: "Failed to generate blog ideas" }, { status: 500 })
  }
}
