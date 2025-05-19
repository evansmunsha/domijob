import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { generateAIResponse } from "@/app/utils/openai";
import { JobPost } from "@prisma/client";

// Type for the job match results from AI
type JobMatch = {
  jobId: string;
  score: number;
  reason: string;
};

// Type for jobs with company info included
type JobWithCompany = JobPost & {
  company: {
    name: string;
    location?: string | null;
  };
};

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id ?? null;
    const { resumeText, jobIds } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    // If specific job IDs are provided, match against those
    // Otherwise fetch recent active jobs
    const jobs = jobIds?.length > 0
      ? await prisma.jobPost.findMany({
          where: {
            id: { in: jobIds },
            status: "ACTIVE",
          },
          include: {
            company: {
              select: {
                name: true,
                location: true
              }
            }
          }
        })
      : await prisma.jobPost.findMany({
          where: {
            status: "ACTIVE",
          },
          take: 20,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            company: {
              select: {
                name: true,
                location: true
              }
            }
          }
        });

    if (jobs.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Create a prompt for the AI
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
    },
    ...more matches sorted by score
  ]
}`;

    // Call OpenAI
    const result = await generateAIResponse(
      userId,
      "job_match",
      systemPrompt,
      userPrompt,
      { cache: true }
    );

    // Store user's resume for future use if they don't have one
    if (userId) {
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        include: { JobSeeker: true }
      });

      if (userProfile?.JobSeeker && !userProfile.JobSeeker.resume) {
        await prisma.jobSeeker.update({
          where: { userId: userId },
          data: { resume: resumeText }
        });
      }
    }

    // Enhance the results with full job details
    const enhancedMatches = result.matches.map((match: JobMatch) => {
      const job = jobs.find((j: JobWithCompany) => j.id === match.jobId);
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
    }).filter((match: { job: any }) => match.job !== null);

    return NextResponse.json({ matches: enhancedMatches });
  } catch (error) {
    console.error("Job matching error:", error);
    return NextResponse.json(
      { error: "Failed to match jobs" },
      { status: 500 }
    );
  }
}