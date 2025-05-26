import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { OpenAI } from "openai";
import mammoth from "mammoth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;
const FEATURE_COST = 10;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("❌ No file uploaded");
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    const fileName = file.name?.toLowerCase() || "";
    if (!fileName.endsWith(".docx")) {
      console.warn("❌ Unsupported file type:", fileName);
      return new Response(JSON.stringify({ error: "Only DOCX files are supported." }), { status: 400 });
    }

    // 🔐 Handle guest credits
    const cookieStore = cookies();
    const cookie = (await cookieStore).get(GUEST_CREDIT_COOKIE);
    let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
    if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

    if (guestCredits < FEATURE_COST) {
      return new Response(
        JSON.stringify({
          error: "You've used all your free credits. Sign up to get 50 more!",
          requiresSignup: true,
        }),
        { status: 403 }
      );
    }

    // 📉 Deduct credits
    const updatedCredits = guestCredits - FEATURE_COST;
    try {
      (await cookieStore).set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (err) {
      console.warn("⚠️ Could not set guest credit cookie:", err);
    }

    // 📄 Parse DOCX content
    let plainText = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      plainText = result.value.replace(/\s+/g, " ").trim();
    } catch (err) {
      console.error("❌ DOCX parsing failed:", err);
      return new Response(JSON.stringify({ error: "Failed to parse DOCX file." }), { status: 500 });
    }

    if (!plainText || plainText.length < 30) {
      return new Response(JSON.stringify({ error: "Resume file is too short or empty." }), { status: 400 });
    }

    // ✨ Prompt to GPT
    const prompt = `
You are a professional resume writer. Improve and rewrite the following resume to be more impactful, professional, and ATS-optimized. Use clear formatting, strong action verbs, and concise bullet points where applicable.

Resume:
---
${plainText}
---`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a professional resume editor. Only return the enhanced resume text. No commentary or formatting like Markdown.",
        },
        { role: "user", content: prompt },
      ],
    });

    // 🧠 Stream output
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`CREDITS_REMAINING:${updatedCredits}\n\n`)
        );

        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }

        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("🔥 Unhandled /resume-parse error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
