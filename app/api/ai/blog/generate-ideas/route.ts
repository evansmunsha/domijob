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
      model: openai("gpt-4o-mini"),
      system: `You are an expert content strategist specializing in ${niche || "career development and AI tools"}. Generate engaging, SEO-friendly blog post ideas that will attract job seekers and career-focused professionals.`,
      prompt: `Generate 5 unique and diverse blog post ideas based on these specific keywords: "${keywords}"

IMPORTANT: Make sure each idea is directly related to the keywords provided. Be creative and specific.

For each idea, provide:
1. A compelling title (50-60 characters)
2. A brief excerpt (120-150 characters)
3. 3-5 relevant keywords (include variations of the input keywords)
4. A category from: Resume Tips, Job Search, Career Advice, Interview Tips, Remote Work, AI Tools, Industry Insights, Salary Negotiation
5. Difficulty: Beginner, Intermediate, or Advanced
6. Estimated read time: 5-15 minutes

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "string",
    "excerpt": "string", 
    "keywords": ["string", "string", "string"],
    "category": "string",
    "difficulty": "string",
    "estimatedReadTime": number
  }
]

Focus on actionable, benefit-driven titles that solve real problems for job seekers and career professionals.`,
      maxTokens: 2500,
      temperature: 0.8, // Add some creativity
    })

    console.log("✅ AI generation completed, response length:", text.length)

    try {
      // Clean the response to ensure it's valid JSON
      let cleanedText = text.trim()

      // Remove any markdown formatting if present
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
      }

      // Remove any extra text before or after the JSON array
      const jsonStart = cleanedText.indexOf("[")
      const jsonEnd = cleanedText.lastIndexOf("]") + 1

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd)
      }

      const ideas = JSON.parse(cleanedText)

      // Validate the structure
      if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error("Invalid response structure")
      }

      // Validate each idea has required fields
      const validatedIdeas = ideas.map((idea: any, index: number) => ({
        title: idea.title || `Blog Idea ${index + 1}`,
        excerpt: idea.excerpt || "Discover valuable insights for your career growth.",
        keywords: Array.isArray(idea.keywords) ? idea.keywords : [keywords],
        category: idea.category || "Career Advice",
        difficulty: ["Beginner", "Intermediate", "Advanced"][index % 3],
        estimatedReadTime:
          typeof idea.estimatedReadTime === "number" ? idea.estimatedReadTime : Math.floor(Math.random() * 10) + 5,
      }))

      console.log("✅ JSON parsed successfully, ideas count:", validatedIdeas.length)
      return NextResponse.json({ ideas: validatedIdeas })
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError)
      console.log("Raw AI response:", text.substring(0, 1000))

      // Generate dynamic fallback content based on keywords
      const keywordArray = keywords.split(",").map((k: string) => k.trim().toLowerCase())
      const primaryKeyword = keywordArray[0] || "career"

      const fallbackTemplates = [
        {
          title: `Master ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} in 2024`,
          excerpt: `Essential strategies and tips to excel in ${primaryKeyword} and advance your career.`,
          category: "Career Advice",
        },
        {
          title: `${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Best Practices Guide`,
          excerpt: `Learn proven techniques and avoid common mistakes in ${primaryKeyword}.`,
          category: "Industry Insights",
        },
        {
          title: `How to Leverage ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} for Success`,
          excerpt: `Practical steps to use ${primaryKeyword} effectively in your professional journey.`,
          category: "Job Search",
        },
      ]

      const fallbackIdeas = fallbackTemplates.map((template, index) => ({
        title: template.title,
        excerpt: template.excerpt,
        keywords: keywordArray.slice(0, 4),
        category: template.category,
        difficulty: ["Beginner", "Intermediate", "Advanced"][index % 3],
        estimatedReadTime: Math.floor(Math.random() * 8) + 5,
      }))

      return NextResponse.json({
        ideas: fallbackIdeas,
        warning: "AI response parsing failed, using keyword-based fallback content",
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
