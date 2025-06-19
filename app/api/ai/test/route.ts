import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          details: "Please set OPENAI_API_KEY in your environment variables",
        },
        { status: 500 },
      )
    }

    // Test AI SDK import and basic functionality
    try {
      const { generateText } = await import("ai")
      const { openai } = await import("@ai-sdk/openai")

      console.log("🤖 Testing AI generation...")

      const { text } = await generateText({
        model: openai("gpt-4o-mini"), // Using cheaper model for testing
        prompt: "Say 'Hello, AI is working!' in exactly 5 words.",
        maxTokens: 20,
      })

      console.log("✅ AI test successful:", text)

      return NextResponse.json({
        success: true,
        message: "AI is working correctly",
        testResponse: text,
        timestamp: new Date().toISOString(),
      })
    } catch (aiError) {
      console.error("❌ AI generation failed:", aiError)

      return NextResponse.json(
        {
          error: "AI generation failed",
          details: aiError instanceof Error ? aiError.message : "Unknown AI error",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Test endpoint error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
