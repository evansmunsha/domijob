import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { topic, contentType } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    // Validate inputs
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          fallback: true,
        },
        { status: 500 },
      )
    }

    let userPrompt = ""
    let maxTokens = 800

    switch (contentType) {
      case "outline":
        maxTokens = 600
        userPrompt = `Create a detailed blog post outline for: "${topic}"

Write this as an actual outline structure with:
- Clear section headings (use ## for main sections)
- 2-3 bullet points under each section
- Logical flow from introduction to conclusion
- Natural places to mention relevant DomiJob tools

Format as markdown with proper headings and bullet points.`
        break

      case "introduction":
        maxTokens = 400
        userPrompt = `Write an engaging introduction for a blog post about: "${topic}"

Requirements:
- 150-200 words of actual content
- Start with a compelling hook
- Explain why this matters to job seekers
- Preview the value readers will get
- Use conversational, helpful tone

Write the actual introduction paragraphs.`
        break

      case "section":
        maxTokens = 700
        userPrompt = `Write a comprehensive section for a blog post about: "${topic}"

Requirements:
- Include a compelling section heading
- 300-400 words of practical content
- 3-4 actionable tips with explanations
- Include a real-world example
- Use "you" language, be conversational

Write the actual section content.`
        break

      case "conclusion":
        maxTokens = 300
        userPrompt = `Write a strong conclusion for a blog post about: "${topic}"

Requirements:
- 120-150 words of actual content
- Summarize key takeaways
- Include encouraging call-to-action
- End with engaging question for comments
- Motivational, forward-looking tone

Write the actual conclusion paragraphs.`
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const result = await generateText({
      model: openai("gpt-4o-mini"), // Use mini for faster, more reliable responses
      prompt: userPrompt,
      maxTokens: maxTokens,
      temperature: 0.7,
    })

    // Validate the response
    if (!result.text || result.text.length < 100) {
      throw new Error("Generated content too short or empty")
    }

    return NextResponse.json({
      content: result.text,
    })
  } catch (error) {
    console.error("AI content generation error:", error)

    // Return fallback content instead of failing
    const fallbackContent = `<h2>Getting Started with ${"Your Career"}</h2>

<p>This is a placeholder article about ${"career development"}. The AI content generation system is currently experiencing issues, but here's some helpful information to get you started.</p>

<h3>Key Points to Consider</h3>

<ul>
<li>Research your target industry and role requirements</li>
<li>Update your resume with relevant keywords and achievements</li>
<li>Practice your interview skills and prepare compelling stories</li>
<li>Network with professionals in your field</li>
<li>Stay updated with industry trends and developments</li>
</ul>

<h3>Next Steps</h3>

<p>While we work on improving our AI content generation, you can explore our other career tools and resources. Check out our <strong><a href="/ai-tools/resume-enhancer">Resume Enhancer</a></strong> to optimize your resume for ATS systems.</p>

<p><em>What specific challenges are you facing in your career journey? Share your thoughts in the comments below!</em></p>`

    return NextResponse.json({
      content: fallbackContent,
    })
  }
}
