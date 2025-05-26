// app/api/ai/match-jobs/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { generateAIResponse } from "@/app/utils/openai";
import { cookies } from "next/headers";
import { auth } from "@/app/utils/auth";
import { CREDIT_COSTS } from "@/app/utils/credits";

const GUEST_CREDIT_COOKIE = 'domijob_guest_credits';
const MAX_GUEST_CREDITS = 50;

export async function POST(req: Request) {
  try {
    // ✅ Move body parsing to the top
    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    const featureCost = CREDIT_COSTS.job_match || 10;
    const session = await auth();
    const userId = session?.user?.id;

    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };

    if (userId) {
      // Authenticated user credit logic
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
              description: `Used ${featureCost} credits for resume analysis`,
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
      // Guest credit logic
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
          { status: 403 }
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

    // ✅ Resume analysis with safe try/catch
    const systemPrompt = `You are an expert resume analyzer. Extract key skills, experience, job titles, and other relevant information from the resume text provided.`;

    const userPrompt = `Please analyze this resume and extract:
1. Technical skills
2. Soft skills
3. Job titles
4. Years of experience
5. Industry specializations
6. Education
7. Certifications
8. Languages

Resume:
${resumeText}`;

    let resumeAnalysis;
    try {
      resumeAnalysis = await generateAIResponse(
        userId || "guest",
        "job_match",
        systemPrompt,
        userPrompt,
        { temperature: 0.1, skipCreditCheck: true }
      );
    } catch (err) {
      console.error("Error analyzing resume:", err);
      return NextResponse.json({ error: "AI resume analysis failed" }, { status: 500 });
    }

    // ✅ Limit to 20 jobs to reduce token size
    const activeJobs = await prisma.jobPost.findMany({
      where: { status: "ACTIVE" },
      include: {
        company: { select: { name: true, location: true } },
      },
      take: 20,
    });

    if (activeJobs.length === 0) {
      return NextResponse.json({
        matches: [],
        message: "No active jobs found.",
        ...creditInfo,
      });
    }

    const matchPrompt = `Match the candidate with jobs based on this analysis:
${JSON.stringify(resumeAnalysis, null, 2)}

Jobs:
${activeJobs.map((job, i) => `
Job ${i + 1}:
- ID: ${job.id}
- Title: ${job.jobTitle}
- Company: ${job.company?.name}
- Description: ${job.jobDescription}
`).join('\n')}

Respond with a JSON array like:
[{ jobId, matchScore, reasons: [], missingSkills: [] }]
Only include matches with score >= 50.`;

    let jobMatches;
    try {
      jobMatches = await generateAIResponse(
        userId || "guest",
        "job_match",
        "You are an expert job matching assistant.",
        matchPrompt,
        { temperature: 0.2, skipCreditCheck: true }
      );
    } catch (err) {
      console.error("Error matching jobs:", err);
      return NextResponse.json({ error: "AI job matching failed" }, { status: 500 });
    }

    // ✅ Validate structure
    if (!jobMatches?.matches || !Array.isArray(jobMatches.matches)) {
      return NextResponse.json({ error: "Invalid AI match format" }, { status: 500 });
    }

    // Enhance match info
    const enhancedMatches = jobMatches.matches.map((match: any) => {
      const job = activeJobs.find(j => j.id === match.jobId);
      if (!job) return null;
      return {
        ...match,
        job: {
          id: job.id,
          title: job.jobTitle,
          company: job.company?.name,
          location: job.location || job.company?.location || "Not specified",
          postedAt: job.createdAt,
          salaryRange: job.salaryFrom && job.salaryTo
            ? `$${job.salaryFrom} - $${job.salaryTo}`
            : job.salaryFrom
              ? `$${job.salaryFrom}+`
              : "Not specified",
          employmentType: job.employmentType,
        },
      };
    }).filter(Boolean);

    // Sort by match score
    enhancedMatches.sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({
      matches: enhancedMatches,
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
      isGuest: creditInfo.isGuest,
    });

  } catch (error) {
    console.error("Unhandled error in /api/ai/match-jobs:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
