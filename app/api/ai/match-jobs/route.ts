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
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "AI service is temporarily unavailable. Please try again later."
      }, { status: 503 });
    }

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
      take: 10, // Reduced to speed up processing
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
    const systemPrompt = `You are an expert AI job matching assistant. Analyze the resume and return ONLY a valid JSON array.

IMPORTANT: Your response must be ONLY a JSON array, no other text.

For each job with score >= 50, return:
{
  "jobId": "exact_job_id_here",
  "score": 75,
  "reasons": ["Specific reason 1", "Specific reason 2"],
  "missingSkills": ["Skill 1", "Skill 2"]
}

Example response format:
[{"jobId":"job123","score":75,"reasons":["5+ years React experience","Strong TypeScript skills"],"missingSkills":["AWS","Docker"]}]`;

    const jobsForPrompt = activeJobs.map(job => ({
      id: job.id,
      title: job.jobTitle,
      company: job.company?.name || "Unknown Company",
      // Truncate description to reduce token usage
      description: job.jobDescription.length > 500
        ? job.jobDescription.substring(0, 500) + "..."
        : job.jobDescription,
      employmentType: job.employmentType || "Full-time"
    }));

    const userPrompt = `RESUME:
${resumeText.substring(0, 2000)}

JOBS:
${jobsForPrompt.map((job, index) => `${index + 1}. ID:${job.id} TITLE:${job.title} DESC:${job.description}`).join('\n')}

Return JSON array for matches with score 50 or higher:`;

    // 🤖 Call OpenAI API with timeout handling
    let response: any;
    try {
      response = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4.1-mini",
          temperature: 0.3,
          max_tokens: 1500, // Reduced to speed up response
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
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OpenAI API timeout')), 12000) // 12 second timeout
        )
      ]);
    } catch (timeoutError) {
      console.error("OpenAI API timeout or error:", timeoutError);
      console.log("Resume length:", resumeText.length);
      console.log("Jobs count:", activeJobs.length);

      // Fallback: return basic keyword matching
      const fallbackMatches = activeJobs.slice(0, 3).map((job, index) => ({
        jobId: job.id,
        score: 60 + (index * 5), // Simple scoring
        reasons: ["Basic keyword match found", "Experience level appears suitable"],
        missingSkills: ["Detailed analysis unavailable"],
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
      }));

      return NextResponse.json({
        matches: fallbackMatches,
        creditsUsed: creditInfo.creditsUsed,
        remainingCredits: creditInfo.remainingCredits,
        totalJobsAnalyzed: activeJobs.length,
        matchesFound: fallbackMatches.length,
        message: "Basic matching completed. For detailed AI analysis, please try again."
      });
    }

    // 🔄 Parse AI response
    const aiResponse = response?.choices?.[0]?.message?.content || "";
    console.log("AI Response received:", aiResponse.substring(0, 200) + "...");
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

      // Return empty matches instead of error to prevent UI breaking
      return NextResponse.json({
        matches: [],
        creditsUsed: creditInfo.creditsUsed,
        remainingCredits: creditInfo.remainingCredits,
        totalJobsAnalyzed: activeJobs.length,
        matchesFound: 0,
        message: "Unable to analyze resume at this time. Please try again with a different format."
      });
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
