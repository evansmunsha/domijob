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

    const systemPrompt = `You are an expert content writer for DomiJob, a career platform with AI-powered tools. 

IMPORTANT: Always naturally integrate mentions of DomiJob's AI tools when relevant:
- Resume Enhancer (/ai-tools/resume-enhancer) - for resume optimization and ATS compatibility
- Job Matching (/jobs) - for finding relevant job opportunities  
- Career Assessment (/ai-tools/career-assessment) - for career guidance
- Interview Prep (/ai-tools/interview-prep) - for interview preparation
- Salary Negotiation (/ai-tools/salary-negotiator) - for salary discussions

Write engaging, actionable content that helps job seekers while encouraging them to try relevant AI tools. Use clickable links and call-to-actions naturally within the content.`

    let userPrompt = ""
    let maxTokens = 800

    switch (contentType) {
      case "outline":
        maxTokens = 600
        userPrompt = `Create a blog post outline for: "${topic}"

Structure:
1. Hook/Introduction 
2. 4-5 main sections with actionable tips
3. AI tool recommendations (naturally integrated)
4. Conclusion with call-to-action

Include specific mentions of relevant DomiJob AI tools with links:
- [Try Resume Enhancer →](/ai-tools/resume-enhancer)
- [Find Jobs →](/jobs)
- [Career Assessment →](/ai-tools/career-assessment)
- [Interview Prep →](/ai-tools/interview-prep)
- [Salary Negotiator →](/ai-tools/salary-negotiator)

Format with clear headings and bullet points.`
        break

      case "introduction":
        maxTokens = 400
        userPrompt = `Write an engaging introduction for: "${topic}"

Requirements:
- 150-200 words
- Hook the reader with a compelling statistic or question
- Preview the value they'll get
- Naturally mention how DomiJob's AI tools can help
- Include a relevant tool link if appropriate

Example tool mentions:
"...optimize your resume with our AI Resume Enhancer"
"...find your perfect job match using our AI-powered job search"

Focus on career advancement and practical benefits.`
        break

      case "section":
        maxTokens = 700
        userPrompt = `Write a comprehensive section for: "${topic}"

Requirements:
- 300-400 words
- Include 3-4 actionable tips
- Use bullet points and subheadings
- Include 1 real-world example
- Naturally integrate 1-2 relevant DomiJob AI tool mentions with clickable links

Available tools to mention:
- **Resume Enhancer** [Try it →](/ai-tools/resume-enhancer) - for resume optimization
- **Job Matching** [Find jobs →](/jobs) - for job search
- **Career Assessment** [Take assessment →](/ai-tools/career-assessment) - for career guidance
- **Interview Prep** [Practice now →](/ai-tools/interview-prep) - for interviews
- **Salary Negotiator** [Get insights →](/ai-tools/salary-negotiator) - for salary talks

Structure:
## [Section Title]
Brief intro paragraph

### Key Strategies:
• Tip 1 with explanation
• Tip 2 with explanation  
• Tip 3 with AI tool integration
• Tip 4 with explanation

**Pro Tip:** [Mention relevant AI tool naturally]

Example: Brief real-world scenario`
        break

      case "conclusion":
        maxTokens = 300
        userPrompt = `Write a strong conclusion for: "${topic}"

Requirements:
- 120-150 words
- Summarize 2-3 key takeaways
- Include call-to-action to try relevant AI tools
- End with engaging question for comments
- Encourage newsletter subscription

Template structure:
"Ready to [achieve goal]? Here are your next steps:

1. [Key takeaway 1]
2. [Key takeaway 2] 
3. Try our [relevant AI tool] to [specific benefit]

[Relevant AI tool link with compelling CTA]

Don't forget to subscribe to our newsletter for weekly career tips!

What's your biggest challenge with [topic]? Share in the comments below!"`
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
