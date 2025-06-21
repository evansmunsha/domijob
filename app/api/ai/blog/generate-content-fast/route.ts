import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topic, category } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    // Fast fallback content generation
    const fastContent = `<h2>${topic}: A Quick Guide</h2>

<p>Here's a comprehensive overview of ${topic} to help advance your career.</p>

<h3>Key Strategies</h3>

<ul>
<li><strong>Research thoroughly:</strong> Understand the current market trends and requirements</li>
<li><strong>Optimize your approach:</strong> Use data-driven strategies to improve your results</li>
<li><strong>Stay consistent:</strong> Regular effort leads to better outcomes</li>
<li><strong>Seek feedback:</strong> Learn from experts and peers in your field</li>
<li><strong>Adapt quickly:</strong> Be flexible and responsive to changing conditions</li>
</ul>

<h3>Common Mistakes to Avoid</h3>

<ul>
<li>Not researching your target audience or market</li>
<li>Using outdated strategies or information</li>
<li>Failing to track and measure your progress</li>
<li>Not seeking help when you need it</li>
<li>Giving up too quickly when facing challenges</li>
</ul>

<h3>Tools and Resources</h3>

<p>Take advantage of AI-powered tools to accelerate your progress:</p>

<ul>
<li><strong><a href="/ai-tools/resume-enhancer">Resume Enhancer</a></strong> - Optimize your resume for ATS systems</li>
<li><strong><a href="/jobs">Job Matching</a></strong> - Find opportunities that match your skills</li>
<li><strong><a href="/ai-tools/interview-prep">Interview Prep</a></strong> - Practice with AI-powered feedback</li>
<li><strong><a href="/ai-tools/salary-negotiator">Salary Negotiator</a></strong> - Get market data and negotiation tips</li>
</ul>

<h3>Your Next Steps</h3>

<p>Success in ${topic} requires consistent effort and the right strategies. Start by identifying your specific goals and creating a plan to achieve them.</p>

<p>Remember, every expert was once a beginner. Focus on continuous learning and improvement, and don't be afraid to seek help when you need it.</p>

<p><em>What's your biggest challenge with ${topic}? Share your experience in the comments and let's discuss solutions!</em></p>`

    return NextResponse.json({
      content: fastContent,
      success: true,
      fast: true,
      metadata: {
        topic,
        category: category || "General",
        wordCount: fastContent.split(" ").length,
      },
    })
  } catch (error) {
    console.error("Fast content generation error:", error)

    return NextResponse.json(
      {
        error: "Content generation failed",
        fallback: true,
      },
      { status: 500 },
    )
  }
}
