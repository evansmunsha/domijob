import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Generate Content API called")

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

    const { topic, type: contentType, niche } = await request.json()
    console.log("📝 Content generation request:", { topic, contentType, niche })

    if (!topic || !contentType) {
      return NextResponse.json({ error: "Topic and type are required" }, { status: 400 })
    }

    // Import AI SDK
    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    const systemPrompt = `You are an expert content writer for DomiJob, a career platform with AI-powered tools. Write engaging, actionable blog content that directly helps job seekers and professionals.

IMPORTANT GUIDELINES:
- Write actual article content that users will read, NOT instructions or outlines
- Use a conversational, helpful tone
- Include practical tips and real examples
- Naturally mention DomiJob's AI tools when relevant (don't force it)
- Write complete paragraphs and sections, not bullet points or instructions

Available tools to mention naturally:
- Resume Enhancer (/ai-tools/resume-enhancer) - for ATS optimization
- Job Matching (ai-tools/job-matcher) - for finding opportunities  
- Career Assessment (/ai-tools/career-assessment) - for career guidance
- Interview Prep (/ai-tools/interview-prep) - for practice
- Salary Negotiator (/ai-tools/salary-negotiator) - for negotiations`

    let userPrompt = ""
    let maxTokens = 800

    switch (contentType) {
      case "outline":
        maxTokens = 600
        userPrompt = `Create a detailed blog post outline for: "${topic}"

Write this as an actual outline structure that a writer would follow, with:
- Clear section headings
- 2-3 bullet points under each section describing what content goes there
- Logical flow from introduction to conclusion
- Natural places to mention relevant DomiJob tools

Format as a proper outline with headings and sub-points.`
        break

      case "introduction":
        maxTokens = 400
        userPrompt = `Write an engaging introduction for a blog post about: "${topic}"

Requirements:
- 150-200 words of actual article content
- Start with a hook (statistic, question, or relatable scenario)
- Explain why this topic matters to readers
- Preview the value they'll get from reading
- Use a warm, conversational tone
- Write as if speaking directly to the reader

Don't write instructions - write the actual introduction paragraphs.`
        break

      case "section":
        maxTokens = 700
        userPrompt = `Write a comprehensive section for a blog post about: "${topic}"

Requirements:
- 300-400 words of actual article content
- Include a compelling section heading
- Provide 3-4 actionable tips with explanations
- Include a real-world example or scenario
- Use conversational tone with "you" language
- End with a practical takeaway

Write the actual section content that readers will see, not instructions about what to write.`
        break

      case "conclusion":
        maxTokens = 300
        userPrompt = `Write a strong conclusion for a blog post about: "${topic}"

Requirements:
- 120-150 words of actual article content
- Summarize 2-3 key takeaways from the article
- Include an encouraging call-to-action
- End with an engaging question for comments
- Use motivational, forward-looking tone

Write the actual conclusion paragraphs, not instructions.`
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    console.log(`🤖 Generating ${contentType} content with ${maxTokens} max tokens`)

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: maxTokens,
      temperature: 0.7,
    })

    console.log(`✅ Generated ${contentType} content, length: ${text.length}`)

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error(`❌ Generate Content API error:`, error)
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
