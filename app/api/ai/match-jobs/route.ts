import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { cookies } from "next/headers";
import { CREDIT_COSTS } from "@/app/utils/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

type JobMatch = {
  jobId: string;
  score: number;
  reasons: string[];
  missingSkills?: string[];
  job?: {
    title: string;
    company: string;
    location: string;
    createdAt: string;
    salaryRange: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const featureCost = CREDIT_COSTS.job_match || 1;
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
        return NextResponse.json({
          error: "Insufficient credits. Please purchase more credits to continue."
        }, { status: 402 });
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
              description: `Used ${featureCost} credits for AI job matching`,
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
        return NextResponse.json({
          error: "You've used all your free credits. Sign up to get 50 more!",
          requiresSignup: true,
        }, { status: 403 });
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
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({
        error: "Please provide a valid resume text (minimum 50 characters)."
      }, { status: 400 });
    }

    // 🔍 Fetch active jobs from database
    const activeJobs = await prisma.jobPost.findMany({
      where: {
        status: "ACTIVE",
        // Only get jobs posted in the last 90 days for relevancy
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        company: {
          select: {
            name: true,
            location: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20, // Limit to prevent token overflow
    });

    if (activeJobs.length === 0) {
      return NextResponse.json({
        matches: [],
        creditsUsed: creditInfo.creditsUsed,
        remainingCredits: creditInfo.remainingCredits,
        message: "No active jobs found. Please check back later for new opportunities."
      });
    }

    // 🧠 Create AI prompt for job matching
    const systemPrompt = `You are an expert AI job matching assistant. Your task is to analyze a resume and match it against job postings, providing detailed scoring and feedback.

For each job, you must return a JSON object with:
- jobId: the exact job ID provided
- score: match percentage from 0-100 (be realistic, most matches are 60-85%)
- reasons: array of 2-4 specific reasons why this person is a good fit
- missingSkills: array of 0-3 key skills/qualifications they're missing (if any)

Only include matches with score >= 50. Be thorough but concise in your analysis.`;

    const jobsForPrompt = activeJobs.map(job => ({
      id: job.id,
      title: job.jobTitle,
      company: job.company?.name || "Unknown Company",
      location: job.location || job.company?.location || "Not specified",
      description: job.jobDescription,
      requirements: job.jobDescription || "", // Use jobDescription as requirements
      salaryRange: job.salaryFrom && job.salaryTo
        ? `$${job.salaryFrom} - $${job.salaryTo}`
        : job.salaryFrom
          ? `$${job.salaryFrom}+`
          : "Not specified",
      employmentType: job.employmentType || "Full-time"
    }));

    const userPrompt = `Analyze this resume and match it against the following job postings:

RESUME:
${resumeText}

JOBS TO MATCH:
${jobsForPrompt.map((job, index) => `
Job ${index + 1}:
ID: ${job.id}
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Employment Type: ${job.employmentType}
Salary: ${job.salaryRange}
Description: ${job.description}
Requirements: ${job.requirements}
`).join('\n')}

Return a JSON array of matches with score >= 50. Format:
[
  {
    "jobId": "exact_job_id_here",
    "score": 75,
    "reasons": ["Specific reason 1", "Specific reason 2"],
    "missingSkills": ["Skill 1", "Skill 2"]
  }
]

Only return valid JSON, no other text.`;

    // 🤖 Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // 🔄 Parse AI response
    const aiResponse = response.choices[0].message?.content || "";
    let matches: JobMatch[] = [];

    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const parsedMatches = JSON.parse(jsonString);

      if (Array.isArray(parsedMatches)) {
        matches = parsedMatches;
      } else {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("AI Response:", aiResponse);
      return NextResponse.json({
        error: "Failed to analyze resume. Please try again."
      }, { status: 500 });
    }

    // 🔗 Enhance matches with job details
    const enhancedMatches = matches
      .map((match) => {
        const job = activeJobs.find(j => j.id === match.jobId);
        if (!job) return null;

        return {
          jobId: match.jobId,
          score: match.score,
          reasons: match.reasons || [],
          missingSkills: match.missingSkills || [],
          job: {
            title: job.jobTitle,
            company: job.company?.name || "Unknown Company",
            location: job.location || job.company?.location || "Not specified",
            createdAt: job.createdAt.toISOString(),
            salaryRange: job.salaryFrom && job.salaryTo
              ? `$${job.salaryFrom} - $${job.salaryTo}`
              : job.salaryFrom
                ? `$${job.salaryFrom}+`
                : "Not specified",
          }
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => (b?.score || 0) - (a?.score || 0)); // Sort by score descending

    // 📊 Log usage for analytics
    try {
      await prisma.aIUsageLog.create({
        data: {
          userId: userId || null,
          endpoint: "job_matching",
          tokenCount: response.usage?.total_tokens || 0,
          cost: (response.usage?.total_tokens || 0) * 0.0001, // Rough estimate
        }
      });
    } catch (logError) {
      console.log("Note: AI usage logging skipped");
    }

    // ✅ Return successful response
    return NextResponse.json({
      matches: enhancedMatches,
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
      totalJobsAnalyzed: activeJobs.length,
      matchesFound: enhancedMatches.length,
    });

  } catch (error) {
    console.error("Job matching error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred while matching jobs. Please try again."
    }, { status: 500 });
  }
}
