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

    const { topic, type: contentType } = await request.json()

    if (!topic || !contentType) {
      return NextResponse.json({ error: "Topic and type are required" }, { status: 400 })
    }

    // Import AI SDK
    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    // Ultra-simplified prompts for speed
    let prompt = ""
    let maxTokens = 300

    switch (contentType) {
      case "outline":
        maxTokens = 400
        prompt = `Create a blog outline for "${topic}":

## Introduction
- Hook with statistic or relatable scenario
- Why this matters for career success
- Preview of key insights

## Main Section 1: [Key Point]
- Practical tip with explanation
- Real example or case study

## Main Section 2: [Key Point]  
- Actionable strategy
- Common mistake to avoid

## Main Section 3: [Key Point]
- Advanced technique
- Tool/resource recommendation

## Conclusion
- Key takeaways summary
- Call-to-action
- Engagement question

Make it specific to the topic and career-focused.`
        break

      case "section":
        maxTokens = 500
        prompt = `Write an actual blog section about "${topic}":

Start with an engaging heading, then write 200-250 words that include:
- Clear explanation of the concept
- 3 practical tips readers can use immediately  
- A brief real-world example
- Encouraging, actionable tone

Write as if you're directly helping someone with their career. Use "you" language and be specific.`
        break

      case "introduction":
        maxTokens = 250
        prompt = `Write a blog introduction about "${topic}":

Open with a compelling hook, then write 120-150 words that:
- Connects with readers' career challenges
- Explains why this topic is important now
- Previews the value they'll gain
- Uses encouraging, helpful tone

Write the actual intro paragraphs, not instructions.`
        break

      case "conclusion":
        maxTokens = 200
        prompt = `Write a blog conclusion for "${topic}":

Write 100-120 words that:
- Summarizes key insights
- Motivates readers to take action
- Includes specific next steps
- Ends with engagement question

Write actual conclusion content, not outline points.`
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
