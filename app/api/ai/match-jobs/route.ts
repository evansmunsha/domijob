import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { generateAIResponse } from "@/app/utils/openai";
import { cookies } from "next/headers";

const GUEST_CREDIT_COOKIE = 'domijob_guest_credits';
const MAX_GUEST_CREDITS = 50;
const GUEST_CREDIT_COST = 10;

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const cookie = (await cookieStore).get(GUEST_CREDIT_COOKIE);
    let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

    if (guestCredits < GUEST_CREDIT_COST) {
      return NextResponse.json(
        { error: "Insufficient guest credits. Please sign up to continue." },
        { status: 403 }
      );
    }

    const { resumeText } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    // ✅ Deduct 10 guest credits
    guestCredits -= GUEST_CREDIT_COST;
    (await cookieStore).set(GUEST_CREDIT_COOKIE, guestCredits.toString(), {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

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

    const resumeAnalysis = await generateAIResponse(
      "guest",
      "job_match",
      systemPrompt,
      userPrompt,
      { temperature: 0.1, skipCreditCheck: true }
    );

    const activeJobs = await prisma.jobPost.findMany({
      where: { status: "ACTIVE" },
      include: {
        company: { select: { name: true, location: true } },
      },
      take: 50,
    });

    if (activeJobs.length === 0) {
      return NextResponse.json({ matches: [], message: "No active jobs found." });
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

    const jobMatches = await generateAIResponse(
      "guest",
      "job_match",
      "You are an expert job matching assistant.",
      matchPrompt,
      { temperature: 0.2, skipCreditCheck: true }
    );

    const enhancedMatches = jobMatches.matches?.map((match: any) => {
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
          employmentType: job.employmentType
        }
      };
    }).filter(Boolean) || [];

    enhancedMatches.sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({
      matches: enhancedMatches,
      creditsUsed: GUEST_CREDIT_COST,
      remainingCredits: guestCredits
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
