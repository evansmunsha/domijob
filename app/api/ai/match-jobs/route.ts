import { NextRequest } from "next/server";
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
    const featureCost = CREDIT_COSTS.resume_matching || 10;
    const session = await auth();
    const userId = session?.user?.id;

    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };

    // 🔐 Handle credits: check balance or update guest credits
    if (userId) {
      const userCredits = await prisma.userCredits.findUnique({ where: { userId } });
      if (!userCredits || userCredits.balance < featureCost) {
        return new Response(JSON.stringify({ error: "Insufficient credits." }), { status: 402 });
      }

      // Deduct credits and log transaction
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
              description: `Used ${featureCost} credits for resume job matching`,
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
      // Handle guest credit logic using cookies
      const cookieStore = await cookies();
      const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
      let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
      if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

      if (guestCredits < featureCost) {
        return new Response(JSON.stringify({
          error: "You've used all your free credits. Sign up to get 50 more!",
          requiresSignup: true,
        }), { status: 402 });
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

    // 📝 Parse and validate the request body
    const body = await req.json();
    const { resumeText, jobDescriptions } = body;

    if (!resumeText || resumeText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Please provide a valid resume text." }), { status: 400 });
    }
    if (!jobDescriptions || !Array.isArray(jobDescriptions) || jobDescriptions.length === 0) {
      return new Response(JSON.stringify({ error: "Please provide job descriptions to match against." }), { status: 400 });
    }

    // ✂️ Limit job descriptions to avoid token overload in OpenAI
    const limitedJobs = jobDescriptions.slice(0, 5);

    // 🧠 Craft the prompt for AI
    const prompt = `You are an AI assistant specialized in resume screening.
Your task is to evaluate how well the resume below matches each of the following job descriptions.
For each job, return a JSON object with:
- title: the job title
- matchScore: score from 0 (no match) to 100 (perfect match)
- explanation: why this resume is a good or poor fit
- missingKeywords: important missing skills or phrases from the job description

Only return valid JSON. Do not add explanations or extra comments.

RESUME:
${resumeText}

JOB DESCRIPTIONS:
${limitedJobs.map((job, i) => `Job ${i + 1} - Title: ${job.title}\n${job.description}`).join("\n\n")}`;

    // 🧾 Call OpenAI with prompt and receive result directly (not streamed for simplicity)
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
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
    });

    // 🔄 Parse the response content
    const text = response.choices[0].message?.content || "";
    let matches;
    try {
      matches = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse error:", err);
      return new Response(JSON.stringify({ error: "Failed to parse AI response." }), { status: 500 });
    }

    // ✅ Return result
    return new Response(JSON.stringify({
      metadata: {
        analyzedAt: new Date().toISOString(),
        jobCount: matches.length,
        creditInfo
      },
      matches
    }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    
  } catch (err) {
    console.error("Job matcher error:", err);
    return new Response(JSON.stringify({ error: "Failed to match resume with jobs." }), { status: 500 });
  }
}
