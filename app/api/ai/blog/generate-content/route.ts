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

    const { topic, type, niche } = await request.json()

    if (!topic || !type) {
      return NextResponse.json({ error: "Topic and type are required" }, { status: 400 })
    }

    const systemPrompt = `You are an expert content writer specializing in ${niche}. Write engaging, informative content that helps job seekers and career-focused professionals.`
    let userPrompt = ""

    switch (type) {
      case "outline":
        userPrompt = `Create a detailed blog post outline for: "${topic}"

Include:
1. Compelling introduction hook
2. 5-7 main sections with subpoints
3. Strong conclusion with call-to-action
4. Suggested word count for each section

Format as a structured outline with clear headings and bullet points.`
        break

      case "introduction":
        userPrompt = `Write an engaging introduction for a blog post titled: "${topic}"

The introduction should:
- Hook the reader immediately
- Clearly state the problem/opportunity
- Preview what they'll learn
- Be 150-200 words
- Include relevant statistics or insights
- Connect to career advancement goals`
        break

      case "section":
        userPrompt = `Write a comprehensive section for a blog post about: "${topic}"

The section should:
- Be 300-500 words
- Include practical tips and actionable advice
- Use bullet points and subheadings for readability
- Include real-world examples
- Focus on career advancement benefits`
        break

      case "conclusion":
        userPrompt = `Write a strong conclusion for a blog post about: "${topic}"

The conclusion should:
- Summarize key takeaways
- Reinforce the main benefit
- Include a clear call-to-action
- Encourage engagement (comments, sharing)
- Be 100-150 words
- End with a question to drive discussion`
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: userPrompt,
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error("Error generating content:", error)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}
