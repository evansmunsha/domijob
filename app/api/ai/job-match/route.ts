import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/utils/db";
import { generateAIResponse } from "@/app/utils/openai";
import { JobPost } from "@prisma/client";

const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;
const COST_PER_REQUEST = 10;

type JobMatch = {
  jobId: string;
  score: number;
  reason: string;
};

type JobWithCompany = JobPost & {
  company: {
    name: string;
    location?: string | null;
  };
};

export async function POST(req: Request) {
  try {
    // ✅ Guest credits
    const cookieStore = await cookies();
    const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
    let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

    if (guestCredits < COST_PER_REQUEST) {
      return NextResponse.json(
        { error: "You have 0 credits left. Please sign up to continue." },
        { status: 403 }
      );
    }

    // ✅ Deduct credits and update cookie
    guestCredits -= COST_PER_REQUEST;
    cookieStore.set(GUEST_CREDIT_COOKIE, guestCredits.toString(), {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    const { resumeText, jobIds } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    const jobs: JobWithCompany[] = jobIds?.length > 0
      ? await prisma.jobPost.findMany({
          where: {
            id: { in: jobIds },
            status: "ACTIVE",
          },
          include: {
            company: {
              select: { name: true, location: true }
            }
          }
        })
      : await prisma.jobPost.findMany({
          where: { status: "ACTIVE" },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: { name: true, location: true }
            }
          }
        });

    if (jobs.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const systemPrompt = `You are an expert job matching system. Analyze the resume and job descriptions to find the best matches based on skills, experience, and qualifications. Return a JSON object with an array of matches, each containing jobId and score (0-100) and brief reason for the match.`;

    const userPrompt = `Resume:
${resumeText}

Jobs to analyze:
${jobs.map((job: JobWithCompany) => `ID: ${job.id}
Title: ${job.jobTitle}
Company: ${job.company.name}
Location: ${job.location || job.company.location}
Description: ${job.jobDescription}
Benefits: ${job.benefits?.join(", ") || "Not specified"}
---`).join('\n\n')}

Return JSON in the following format:
{
  "matches": [
    {
      "jobId": "job-id-1",
      "score": 85,
      "reason": "Strong match in [specific skills] with 5+ years relevant experience"
    }
  ]
}`;

    const result = await generateAIResponse(
      "guest",
      "job_match",
      systemPrompt,
      userPrompt,
      { cache: true, skipCreditCheck: true }
    );

    const enhancedMatches = result.matches?.map((match: JobMatch) => {
      const job = jobs.find((j) => j.id === match.jobId);
      return {
        ...match,
        job: job ? {
          id: job.id,
          title: job.jobTitle,
          company: job.company.name,
          location: job.location || job.company.location,
          createdAt: job.createdAt
        } : null
      };
    }).filter((match: { job: any }) => match.job !== null) || [];

    return NextResponse.json({
      matches: enhancedMatches,
      creditsUsed: COST_PER_REQUEST,
      remainingCredits: guestCredits
    });

  } catch (error) {
    console.error("Job matching error:", error);
    return NextResponse.json(
      { error: "Failed to match jobs" },
      { status: 500 }
    );
  }
}
