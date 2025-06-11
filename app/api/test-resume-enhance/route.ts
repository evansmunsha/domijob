import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, targetJobTitle } = body;

    // Debug information
    const debugInfo = {
      hasResumeText: !!resumeText,
      resumeLength: resumeText?.length || 0,
      wordCount: resumeText ? resumeText.trim().split(/\s+/).length : 0,
      targetJobTitle: targetJobTitle || "Not provided",
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    };

    // Validation checks
    const validationResults = {
      hasText: !!resumeText,
      minLength: resumeText && resumeText.trim().length >= 50,
      maxWords: resumeText ? resumeText.trim().split(/\s+/).length <= 2500 : true,
      passesValidation: false
    };

    validationResults.passesValidation = 
      validationResults.hasText && 
      validationResults.minLength && 
      validationResults.maxWords;

    // Sample test with short resume
    const testResume = `
John Doe
Software Engineer
Email: john@example.com

Experience:
- 5 years of software development
- Expert in React, Node.js, and TypeScript
- Led team of 4 developers
- Built scalable web applications

Education:
- Bachelor's in Computer Science
- University of Technology

Skills:
- JavaScript, Python, Java
- AWS, Docker, Kubernetes
- Agile development
    `.trim();

    const testWordCount = testResume.split(/\s+/).length;

    return NextResponse.json({
      debug: debugInfo,
      validation: validationResults,
      testResume: {
        text: testResume,
        wordCount: testWordCount,
        wouldPass: testWordCount <= 2500 && testWordCount >= 50
      },
      recommendations: {
        currentIssues: [
          !validationResults.hasText && "No resume text provided",
          !validationResults.minLength && "Resume text too short (minimum 50 characters)",
          !validationResults.maxWords && "Resume text too long (maximum 2500 words)"
        ].filter(Boolean),
        suggestions: [
          "Try with a shorter resume (1-2 pages)",
          "Ensure resume has meaningful content",
          "Check that file upload extracted text correctly"
        ]
      }
    });

  } catch (error) {
    console.error("Test resume enhance error:", error);
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Resume Enhancement Test Endpoint",
    usage: "POST with { resumeText: string, targetJobTitle?: string }",
    limits: {
      minCharacters: 50,
      maxWords: 2500,
      recommendedLength: "1-3 pages (500-1500 words)"
    }
  });
}
