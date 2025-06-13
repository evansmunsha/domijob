import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { cookies } from "next/headers";
import { CREDIT_COSTS } from "@/app/utils/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "AI service is temporarily unavailable. Please try again later."
      }, { status: 503 });
    }

    const featureCost = CREDIT_COSTS.resume_enhancement || 15;
    const session = await auth();
    const userId = session?.user?.id;

    // Handle credits
    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };

    if (userId) {
      const userCredits = await prisma.userCredits.findUnique({ where: { userId } });
      if (!userCredits || userCredits.balance < featureCost) {
        return NextResponse.json({ error: "Insufficient credits." }, { status: 402 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.userCredits.update({
          where: { userId },
          data: { balance: userCredits.balance - featureCost },
        });
        try {
          await tx.creditTransaction.create({
            data: {
              userId,
              amount: -featureCost,
              type: "usage",
              description: `Used ${featureCost} credits for resume enhancement`,
            },
          });
        } catch {
          console.log("Note: Credit transaction logging skipped");
        }
      });

      creditInfo = {
        isGuest: false,
        creditsUsed: featureCost,
        remainingCredits: userCredits.balance - featureCost,
      };
    } else {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
      let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
      if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

      if (guestCredits < featureCost) {
        return NextResponse.json({
          error: "You've used all your free credits. Sign up to get 50 more!",
          requiresSignup: true,
        }, { status: 402 });
      }

      const updatedCredits = guestCredits - featureCost;
      cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
      });

      creditInfo = {
        isGuest: true,
        creditsUsed: featureCost,
        remainingCredits: updatedCredits,
      };
    }

    const body = await req.json();
    const { resumeText, targetJobTitle } = body;

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Please provide a valid resume text." }, { status: 400 });
    }

    const wordCount = resumeText.trim().split(/\s+/).length;
    if (wordCount > 3500) {
      return NextResponse.json({ 
        error: `Resume is too long (${wordCount} words). Please shorten to under 3500 words.` 
      }, { status: 400 });
    }

    const prompt = `
    You are a professional resume reviewer and ATS optimization expert.
    
    Analyze the following resume content and return a detailed report in JSON format. The report should be optimized for job seekers applying to ${targetJobTitle || "unspecified job title"}.
    
    Please include the following sections in your response:
    
    - "overview": A professional summary of the resume's quality (3–4 sentences)
    - "atsScore": A numeric ATS optimization score between 0 and 100
    - "strengths": At least 6 strengths detected in the resume
    - "weaknesses": At least 4 weaknesses or missing elements
    - "suggestions": An array of sections with multiple actionable improvements. Each suggestion should include:
      - "section": The section name (e.g. "Experience", "Skills", "Projects")
      - "improvements": 2–3 improvements per section
    - "keywords": At least 10 relevant keywords for the target job that are missing or underused
    
    Resume Content:
    ---
    ${resumeText}
    ---
    
    Target Job Title: ${targetJobTitle || "Not provided"}
    
    Respond only with a valid JSON object. No commentary or markdown. Be concise, structured, and complete.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Respond with valid JSON only. No markdown, headers, or commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const content = response.choices[0].message?.content || "{}";
    
    try {
      const parsedResult = JSON.parse(content);
      
      return NextResponse.json({
        ...parsedResult,
        creditsUsed: creditInfo.creditsUsed,
        remainingCredits: creditInfo.remainingCredits,
        isGuest: creditInfo.isGuest,
        wordCount: wordCount
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({
        error: "AI response could not be parsed. Please try again.",
        rawResponse: content.substring(0, 500)
      }, { status: 500 });
    }

  } catch (err) {
    console.error("Simple resume enhance error:", err);
    return NextResponse.json({ 
      error: "Failed to enhance resume.",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}
