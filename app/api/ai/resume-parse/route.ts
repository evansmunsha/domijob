import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { OpenAI } from "openai";
import mammoth from "mammoth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response("No file uploaded", { status: 400 });
  }

  const fileName = file.name?.toLowerCase() || "";
  if (!fileName.endsWith(".docx")) {
    return new Response("Only DOCX files are supported.", { status: 400 });
  }

  // 🔐 Guest credit management
  const cookieStore = cookies();
  const cookie = (await cookieStore).get(GUEST_CREDIT_COOKIE);
  let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

  if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

  if (guestCredits < 10) {
    return new Response(
      JSON.stringify({
        error: "You've used all your free credits. Sign up to get 50 more!",
        requiresSignup: true,
      }),
      { status: 403 }
    );
  }

  // ✅ Decrement credits and update cookie
  const updatedCredits = guestCredits - 10;
  (await cookieStore).set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // 📄 Parse DOCX text
  let plainText: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    plainText = result.value.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("DOCX parsing failed:", error);
    return new Response("Failed to parse DOCX file.", { status: 500 });
  }

  // 🧠 Prompt for enhancement
  const prompt = `
You are a professional resume writer. Improve and rewrite the following resume to be more impactful, professional, and ATS-optimized. Use clear formatting, strong action verbs, and concise bullet points where applicable.

Resume:
---
${plainText}
---`;

  // 🔄 Stream OpenAI response
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
}
