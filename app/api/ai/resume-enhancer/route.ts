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
    const featureCost = CREDIT_COSTS.resume_enhancement || 15;
    const session = await auth();
    const userId = session?.user?.id;

    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };

    // Authenticated user
    if (userId) {
      const userCredits = await prisma.userCredits.findUnique({ where: { userId } });
      if (!userCredits || userCredits.balance < featureCost) {
        return NextResponse.json(
          { error: "Insufficient credits. Please purchase more credits to continue." },
          { status: 402 }
        );
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
      // Guest user
      const cookieStore = await cookies();
      const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
      let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

      if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

      if (guestCredits < featureCost) {
        return NextResponse.json(
          {
            error: "You've used all your free credits. Sign up to get 50 more free credits!",
            requiresSignup: true,
          },
          { status: 402 }
        );
      }

      const updatedCredits = guestCredits - featureCost;
      cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      creditInfo = {
        isGuest: true,
        creditsUsed: featureCost,
        remainingCredits: updatedCredits,
      };
    }

    // Read JSON input
    const body = await req.json();
    const { resumeText, targetJobTitle } = body;

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Please provide a valid resume text." }, { status: 400 });
    }

    const prompt = `
You are a professional resume analyst and ATS optimization expert.

Analyze this resume and provide a detailed structured JSON response with:
- overview: A short summary of the resume quality.
- atsScore: A score from 0 to 100 representing how well the resume is optimized for applicant tracking systems.
- strengths: A list of strong points in the resume.
- weaknesses: A list of weaknesses or areas to improve.
- suggestions: An array of sections with improvement suggestions.
- keywords: A list of keywords that are missing but recommended for the given job title.

Resume Text:
${resumeText}

Target Job Title: ${targetJobTitle || "Not provided"}

Respond ONLY with a JSON object in this format:
{
  "overview": "...",
  "atsScore": 85,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": [
    {
      "section": "Experience",
      "improvements": ["...", "..."]
    }
  ],
  "keywords": ["...", "..."]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You return JSON only. No explanation or commentary." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0].message.content;

    // Attempt to parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch (err) {
      console.error("Failed to parse AI response:", raw);
      return NextResponse.json({ error: "AI response could not be parsed" }, { status: 500 });
    }

    // Send structured response with credit info
    return NextResponse.json({
      ...parsed,
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
    });
  } catch (err) {
    console.error("Error in resume enhancer API:", err);
    return NextResponse.json({ error: "Failed to enhance resume" }, { status: 500 });
  }
}
