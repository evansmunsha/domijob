import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/utils/db";
import { generateAIResponse } from "@/app/utils/openai";
import { JobPost } from "@prisma/client";
import { auth } from "@/app/utils/auth";
import { CREDIT_COSTS } from "@/app/utils/credits";

const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

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
    // Get the feature cost
    const featureCost = CREDIT_COSTS.job_match || 10;
    
    // Check authentication status
    const session = await auth();
    const userId = session?.user?.id;
    
    // Handle credits based on authentication status
    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };
    
    if (userId) {
      // Authenticated user - use database credits
      const userCredits = await prisma.userCredits.findUnique({
        where: { userId }
      });
      
      if (!userCredits || userCredits.balance < featureCost) {
        return NextResponse.json(
          { error: "Insufficient credits. Please purchase more credits to continue." },
          { status: 402 }
        );
      }
      
      // Deduct credits using a transaction
      await prisma.$transaction(async (tx) => {
        // Update user's credit balance
        await tx.userCredits.update({
          where: { userId },
          data: { balance: userCredits.balance - featureCost }
        });
        
        // Log the transaction if the table exists
        try {
          await tx.creditTransaction.create({
            data: {
              userId,
              amount: -featureCost,
              type: "usage",
              description: `Used ${featureCost} credits for job matching`
            }
          });
        } catch (error) {
          // If creditTransaction table doesn't exist, just continue
          console.log("Note: Credit transaction logging skipped");
        }
      });
      
      creditInfo = {
        isGuest: false,
        creditsUsed: featureCost,
        remainingCredits: userCredits.balance - featureCost
      };
    } else {
      // Anonymous user - use cookie credits
      const cookieStore = await cookies();
      const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
      let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
      
      // Validate guest credits
      if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;
      
      if (guestCredits < featureCost) {
        return NextResponse.json(
          { 
            error: "You've used all your free credits. Sign up to get 50 more free credits!",
            requiresSignup: true
          },
          { status: 403 }
        );
      }
      
      // Update guest credits
      const updatedCredits = guestCredits - featureCost;
      cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      creditInfo = {
        isGuest: true,
        creditsUsed: featureCost,
        remainingCredits: updatedCredits
      };
    }

    // Process the request
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
      return NextResponse.json({ 
        matches: [],
        ...creditInfo
      });
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
      userId || "guest",
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
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
      isGuest: creditInfo.isGuest
    });

  } catch (error) {
    console.error("Job matching error:", error);
    return NextResponse.json(
      { error: "Failed to match jobs" },
      { status: 500 }
    );
  }
}