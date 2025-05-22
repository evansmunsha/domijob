import { NextResponse } from "next/server"

// Mock implementation for the resume enhancer API
export async function POST(req: Request) {
  try {
    // Parse request body
    const { resumeText, targetJobTitle } = await req.json()

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Please provide a valid resume with sufficient content" }, { status: 400 })
    }

    // Mock response data
    const mockResponse = {
      overview:
        "Your resume has several strengths but could benefit from some improvements to better highlight your skills and experience.",
      atsScore: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
      strengths: [
        "Good use of action verbs in your experience descriptions",
        "Clear chronological work history",
        "Contact information is complete and professional",
      ],
      weaknesses: [
        "Missing some industry-specific keywords",
        "Achievements could be more quantified with metrics",
        "Some sections could be better organized for readability",
      ],
      suggestions: [
        {
          section: "Professional Summary",
          improvements: [
            "Add more industry-specific keywords relevant to your target role",
            "Highlight your most impressive achievements",
            "Tailor your summary to specifically address the requirements in the job description",
          ],
        },
        {
          section: "Work Experience",
          improvements: [
            "Quantify your achievements with specific metrics and numbers",
            "Focus more on results rather than just responsibilities",
            "Use more powerful action verbs to describe your accomplishments",
          ],
        },
        {
          section: "Skills",
          improvements: [
            "Organize skills into categories for better readability",
            "Add more technical skills relevant to your industry",
            "Remove outdated or irrelevant skills",
          ],
        },
      ],
      keywords: [
        "Project Management",
        "Team Leadership",
        "Strategic Planning",
        "Data Analysis",
        "Customer Relations",
        "Process Improvement",
        "Communication",
        "Problem Solving",
      ],
      creditsUsed: 15,
      remainingCredits: 35,
      isGuest: true,
    }

    // Return the mock response
    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error("Resume enhancement error:", error)
    return NextResponse.json({ error: "Failed to enhance resume. Please try again." }, { status: 500 })
  }
}
