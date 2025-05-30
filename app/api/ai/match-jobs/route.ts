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
    const featureCost = CREDIT_COSTS.job_match || 10;
    const session = await auth();
    const userId = session?.user?.id;

    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };

    if (userId) {
      const userCredits = await prisma.userCredits.findUnique({ where: { userId } });
      if (!userCredits || userCredits.balance < featureCost) {
        return new Response(JSON.stringify({ error: "Insufficient credits." }), { status: 402 });
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

    const body = await req.json();
    const { resumeText, jobDescriptions } = body;

    if (!resumeText || resumeText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Please provide a valid resume text." }), { status: 400 });
    }
    if (!jobDescriptions || !Array.isArray(jobDescriptions) || jobDescriptions.length === 0) {
      return new Response(JSON.stringify({ error: "Please provide job descriptions to match against." }), { status: 400 });
    }

    const prompt = `You are a resume matching AI.
Given the resume below and a list of job descriptions, compare the resume to each job and output a JSON array.
For each job, give:
- title: Job title
- matchScore: A score from 0 to 100
- explanation: Short reason why this resume matches or does not match the job
- missingKeywords: Important missing keywords from the job description

Resume:
---
${resumeText}
---

Jobs:
${jobDescriptions.map((job: any, i: number) => `Job ${i + 1}:\nTitle: ${job.title}\nDescription: ${job.description}`).join("\n\n")}

Respond with only JSON. Do not include commentary or markdown.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      stream: true,
      max_tokens: 1000,
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

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`CREDIT_INFO:${JSON.stringify(creditInfo)}\n\n`));
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
    console.error("Job matcher error:", err);
    return new Response(JSON.stringify({ error: "Failed to match resume with jobs." }), { status: 500 });
  }
}
