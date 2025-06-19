import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const { topic, type } = await request.json()

    if (!topic || !type) {
      return NextResponse.json({ error: "Topic and type are required" }, { status: 400 })
    }

    // Import AI SDK
    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    // Ultra-simplified prompts for speed
    let prompt = ""
    let maxTokens = 300

    switch (type) {
      case "outline":
        maxTokens = 400
        prompt = `Create a simple 5-point outline for "${topic}":
1. Introduction
2. Main Point 1
3. Main Point 2  
4. Main Point 3
5. Conclusion

Keep each point to 1-2 sentences. Focus on career advice.`
        break

      case "section":
        maxTokens = 500
        prompt = `Write a 200-word section about "${topic}" with:
- Brief intro
- 3 bullet points with tips
- Short example
Focus on actionable career advice.`
        break

      case "introduction":
        maxTokens = 250
        prompt = `Write a 100-word introduction for "${topic}" that hooks readers and previews the content. Focus on career benefits.`
        break

      case "conclusion":
        maxTokens = 200
        prompt = `Write an 80-word conclusion for "${topic}" with key takeaways and a call-to-action question.`
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
      maxTokens: maxTokens,
      temperature: 0.5, // Lower temperature for faster, more focused responses
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error("Fast content generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
