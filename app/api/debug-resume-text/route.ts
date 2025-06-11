import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText } = body;

    if (!resumeText) {
      return NextResponse.json({
        error: "No resume text provided",
        debug: {
          hasText: false,
          textLength: 0,
          wordCount: 0
        }
      });
    }

    // Detailed text analysis
    const textLength = resumeText.length;
    const trimmedText = resumeText.trim();
    const words = trimmedText.split(/\s+/);
    const wordCount = words.length;
    
    // Character analysis
    const lines = resumeText.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Sample of the text (first 500 chars)
    const textSample = resumeText.substring(0, 500);
    
    // Check for repeated content or extraction issues
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const repetitionRatio = uniqueWords.size / wordCount;
    
    return NextResponse.json({
      analysis: {
        totalCharacters: textLength,
        totalWords: wordCount,
        totalLines: lines.length,
        nonEmptyLines: nonEmptyLines.length,
        averageWordsPerLine: Math.round(wordCount / nonEmptyLines.length),
        uniqueWords: uniqueWords.size,
        repetitionRatio: Math.round(repetitionRatio * 100) / 100
      },
      validation: {
        passesMinLength: textLength >= 50,
        passesMaxWords: wordCount <= 2500,
        isReasonableLength: wordCount >= 50 && wordCount <= 2500,
        estimatedPages: Math.ceil(wordCount / 250) // ~250 words per page
      },
      textSample: {
        first500Chars: textSample,
        lastWords: words.slice(-20).join(' '), // Last 20 words
        containsRepeatedContent: repetitionRatio < 0.3
      },
      recommendations: wordCount > 2500 ? [
        "The extracted text seems unusually long",
        "Check if file extraction included headers/footers repeatedly",
        "Try uploading a DOCX file instead of PDF",
        "Remove any repeated sections from the text",
        `Current: ${wordCount} words, Target: under 2500 words`
      ] : [
        "Text length looks good",
        `${wordCount} words is within the acceptable range`
      ]
    });

  } catch (error) {
    console.error("Debug resume text error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Resume Text Debug Endpoint",
    usage: "POST with { resumeText: string }",
    purpose: "Analyze resume text length and content for debugging word count issues"
  });
}
