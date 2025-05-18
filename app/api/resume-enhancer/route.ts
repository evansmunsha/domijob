// app/api/resume-enhancer/route.ts

import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const prompt = `
You are an expert resume coach. Improve this resume to look more professional, highlight impact, fix grammar, and make it ready for top-tier job applications:

"${text}"
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const result = response.choices[0].message.content;
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error enhancing resume:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
