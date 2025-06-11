import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "OpenAI API key not configured",
        hasKey: false
      });
    }

    // Simple test call
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with valid JSON only."
        },
        {
          role: "user",
          content: 'Return this JSON: {"test": "success", "status": "working"}'
        }
      ]
    });

    const content = response.choices[0].message?.content || "";
    
    return NextResponse.json({
      success: true,
      hasKey: true,
      response: content,
      usage: response.usage,
      model: response.model
    });

  } catch (error: any) {
    console.error("OpenAI test error:", error);
    return NextResponse.json({
      error: error.message,
      hasKey: !!process.env.OPENAI_API_KEY,
      success: false
    }, { status: 500 });
  }
}
