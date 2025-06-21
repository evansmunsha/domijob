import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  let contentType: string = ""
  let topic: string = ""
  
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

    const { topic: topicParam, type: contentTypeParam, niche } = await request.json()
    topic = topicParam
    contentType = contentTypeParam
    console.log("📝 Content generation request:", { topic, contentType, niche })

    if (!topic || !contentType) {
      return NextResponse.json({ error: "Topic and type are required" }, { status: 400 })
    }

    const systemPrompt = `You are an expert content writer specializing in ${niche || "career development and AI tools"}. Write concise, actionable content that helps job seekers and career-focused professionals. Keep responses focused and practical.`

    let userPrompt = ""
    let maxTokens = 800 // Default token limit

    switch (contentType) {
      case "outline":
        maxTokens = 600 // Reduced for faster generation
        userPrompt = `Create a concise blog post outline for: "${topic}"

Structure:
1. Hook/Introduction (1-2 sentences)
2. 4-5 main sections with 2-3 bullet points each
3. Conclusion with call-to-action

Keep it brief and actionable. Focus on practical career advice.

Example format:
# Introduction
- Hook about the problem
- What readers will learn

# Section 1: [Title]
- Key point 1
- Key point 2

# Section 2: [Title]
- Key point 1
- Key point 2

# Conclusion
- Summary
- Call-to-action`
        break

      case "introduction":
        maxTokens = 400
        userPrompt = `Write an engaging introduction for: "${topic}"

Requirements:
- 120-150 words
- Hook the reader immediately
- State the problem clearly
- Preview the solution
- Include a relevant statistic if possible

Focus on career advancement benefits.`
        break

      case "section":
        maxTokens = 700 // Reduced for faster generation
        userPrompt = `Write a focused section for: "${topic}"

Requirements:
- 250-350 words (keep it concise)
- Include 3-4 actionable tips
- Use bullet points for readability
- Include 1 real-world example
- Focus on immediate career benefits

Structure:
## [Section Title]
Brief intro paragraph

Key tips:
• Tip 1 with brief explanation
• Tip 2 with brief explanation
• Tip 3 with brief explanation

Example: [Brief real-world example]`
        break

      case "conclusion":
        maxTokens = 300
        userPrompt = `Write a strong conclusion for: "${topic}"

Requirements:
- 80-120 words
- Summarize 2-3 key takeaways
- Include clear call-to-action
- End with engaging question
- Encourage reader engagement`
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    console.log(`🤖 Generating ${contentType} content with ${maxTokens} max tokens`)

    // Add timeout wrapper
    const generateWithTimeout = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout

      try {
        const result = await generateText({
          model: openai("gpt-4o-mini"), // Using faster model
          system: systemPrompt,
          prompt: userPrompt,
          maxTokens: maxTokens,
          temperature: 0.7, // Slightly more creative but still focused
        })
        clearTimeout(timeoutId)
        return result
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    const { text } = await generateWithTimeout()

    console.log(`✅ Generated ${contentType} content, length: ${text.length}`)

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error(`❌ Generate Content API error for type ${contentType}:`, error)

    // Provide fallback content for timeouts
    if (error instanceof Error && (error.message.includes("timeout") || error.message.includes("504"))) {
      const fallbackContent = getFallbackContent(contentType, topic)

      return NextResponse.json({
        content: fallbackContent,
        warning: "AI generation timed out, using fallback content. Please try again for AI-generated content.",
      })
    }

    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
        type: contentType,
      },
      { status: 500 },
    )
  }
}

// Fallback content function
function getFallbackContent(contentType: string, topic: string): string {
  switch (contentType) {
    case "outline":
      return `# ${topic}

## Introduction
- Hook: Address the main challenge readers face
- Preview what they'll learn from this post

## Section 1: Understanding the Basics
- Define key concepts
- Explain why this matters for career growth
- Common misconceptions to avoid

## Section 2: Practical Steps
- Step-by-step approach
- Tools and resources needed
- Timeline expectations

## Section 3: Advanced Strategies
- Pro tips for better results
- How to stand out from competition
- Measuring success

## Section 4: Common Mistakes
- What to avoid
- How to recover from setbacks
- Learning from failures

## Conclusion
- Recap key takeaways
- Next steps for readers
- Call-to-action for engagement

*Note: This is a template outline. Please regenerate for AI-customized content.*`

    case "section":
      return `## Getting Started with ${topic}

When it comes to ${topic.toLowerCase()}, many professionals struggle with knowing where to begin. The key is to start with a solid foundation and build systematically.

### Key Strategies:

• **Start with research**: Understand current industry standards and expectations
• **Create a plan**: Break down your goals into manageable, actionable steps  
• **Practice consistently**: Regular practice leads to measurable improvement
• **Seek feedback**: Get input from mentors, peers, or industry professionals

### Real-World Example:
Consider Sarah, a marketing professional who successfully transitioned to a new role by following these exact steps. She spent 2 weeks researching, 1 month planning, and 3 months executing her strategy.

The most important thing to remember is that progress takes time, but with the right approach, you'll see results that advance your career.

*Note: This is template content. Please regenerate for AI-customized content.*`

    case "introduction":
      return `Are you struggling with ${topic.toLowerCase()}? You're not alone. Recent studies show that 73% of professionals face similar challenges in today's competitive job market.

The good news is that with the right strategies and mindset, you can overcome these obstacles and achieve your career goals. In this post, we'll explore proven techniques that have helped thousands of professionals just like you.

By the end of this article, you'll have a clear roadmap for success, practical tools you can implement immediately, and the confidence to take your career to the next level.

*Note: This is template content. Please regenerate for AI-customized content.*`

    case "conclusion":
      return `${topic} doesn't have to be overwhelming when you have the right approach. Remember these key takeaways: focus on consistent action, leverage available resources, and don't be afraid to seek help when needed.

Your career success depends on taking that first step. Start implementing these strategies today, and you'll be amazed at the progress you can make in just a few weeks.

What's your biggest challenge with ${topic.toLowerCase()}? Share your thoughts in the comments below – I'd love to help you overcome any obstacles you're facing.

*Note: This is template content. Please regenerate for AI-customized content.*`

    default:
      return `Content for ${topic} will be generated here. Please try regenerating for AI-customized content.`
  }
}
