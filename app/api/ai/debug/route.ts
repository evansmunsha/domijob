import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check environment variables
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const openAIKeyLength = process.env.OPENAI_API_KEY?.length || 0

    // Test basic AI SDK import
    let aiSdkStatus = "unknown"
    try {
      const { generateText } = await import("ai")
      const { openai } = await import("@ai-sdk/openai")
      aiSdkStatus = "imported successfully"
    } catch (error) {
      aiSdkStatus = `import failed: ${error instanceof Error ? error.message : "unknown error"}`
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAIKey,
        openAIKeyLength: hasOpenAIKey ? `${openAIKeyLength} characters` : "not set",
        openAIKeyPrefix: hasOpenAIKey ? `${process.env.OPENAI_API_KEY?.substring(0, 7)}...` : "not set",
      },
      aiSdk: {
        status: aiSdkStatus,
      },
      session: {
        hasUser: !!session?.user,
        userType: session?.user?.userType,
        userId: session?.user?.id,
      },
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
