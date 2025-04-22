import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { generateAIResponse } from "@/app/utils/openai";
import { deductCredits, CREDIT_COSTS } from "@/app/utils/credits";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to use this feature" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { resumeText } = await req.json();
    
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }
    
    // Check if user has enough credits
    try {
      await deductCredits(userId, "job_match");
    } catch (error) {
      return NextResponse.json(
        { error: "Insufficient credits to use this feature. Please purchase more credits." },
        { status: 402 }
      );
    }
    
    // Extract skills and experience from resume
    const systemPrompt = `You are an expert resume analyzer. Extract key skills, experience, job titles, and other relevant information from the resume text provided. The goal is to identify what kinds of jobs this person would be qualified for.`;
    
    const userPrompt = `Please analyze the following resume text and extract:
1. Technical skills
2. Soft skills
3. Past job titles and roles
4. Years of experience
5. Industry specializations
6. Education level and field
7. Certifications
8. Language proficiencies

Format the output as a concise JSON without explanations. Make this analysis specifically for job matching purposes. Here's the resume:

${resumeText}`;

    const resumeAnalysis = await generateAIResponse(
      userId,
      "job_match",
      systemPrompt,
      userPrompt,
      { temperature: 0.1, skipCreditCheck: true }
    );
    
    // Get active job postings from the database
    const activeJobs = await prisma.jobPost.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        company: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      take: 50, // Limit to most recent 50 jobs for performance
    });
    
    if (activeJobs.length === 0) {
      return NextResponse.json(
        { matches: [], message: "No active jobs found in the system." },
        { status: 200 }
      );
    }
    
    // Create a prompt for job matching
    const matchingSystemPrompt = `You are an expert job matching assistant. Your task is to analyze a candidate's skills and qualifications against job descriptions to find the best matches.`;
    
    const matchingUserPrompt = `I have a candidate with the following skills and qualifications:
${JSON.stringify(resumeAnalysis, null, 2)}

Please match this candidate with the most suitable jobs from the following job postings. For each job, provide a match score (0-100) and a brief explanation of why this job is a good match or not.

Jobs to consider:
${activeJobs.map((job, index) => `
Job ${index + 1}:
- ID: ${job.id}
- Title: ${job.jobTitle}
- Company: ${job.company?.name || 'Unknown'}
- Location: ${job.location || job.company?.location || 'Not specified'}
- Description: ${job.jobDescription}
- Employment Type: ${job.employmentType || 'Not specified'}
- Salary Range: ${job.salaryFrom ? `$${job.salaryFrom}` : 'Not specified'}${job.salaryTo ? ` - $${job.salaryTo}` : ''}
`).join('\n')}

Provide your response as a JSON array of objects, with each object containing:
1. jobId: The ID of the job
2. matchScore: A number from 0-100 representing how good the match is
3. reasons: An array of brief bullet points (as strings) explaining why this is a good match or not
4. missingSkills: An array of skills or qualifications (as strings) the candidate may be missing for this role

Only include jobs with a matchScore of 50 or higher.`;

    const jobMatches = await generateAIResponse(
      userId,
      "job_match",
      matchingSystemPrompt,
      matchingUserPrompt,
      { temperature: 0.2, skipCreditCheck: true }
    );
    
    // Enhance matches with job details
    const enhancedMatches = jobMatches.matches?.map((match: any) => {
      const job = activeJobs.find(j => j.id === match.jobId);
      if (!job) return null;
      
      return {
        ...match,
        job: {
          id: job.id,
          title: job.jobTitle,
          company: job.company?.name,
          location: job.location || job.company?.location || 'Not specified',
          postedAt: job.createdAt,
          salaryRange: job.salaryFrom && job.salaryTo ? 
            `$${job.salaryFrom} - $${job.salaryTo}` : 
            (job.salaryFrom ? `$${job.salaryFrom}+` : 'Not specified'),
          employmentType: job.employmentType
        }
      };
    }).filter(Boolean) || [];
    
    // Sort matches by score (highest first)
    enhancedMatches.sort((a: any, b: any) => b.matchScore - a.matchScore);
    
    // Store user's resume if they don't have one
    try {
      const jobSeeker = await prisma.jobSeeker.findFirst({
        where: { userId }
      });
      
      if (jobSeeker && !jobSeeker.resume) {
        await prisma.jobSeeker.update({
          where: { userId },
          data: { resume: resumeText }
        });
      }
    } catch (error) {
      console.error("Error saving resume:", error);
      // Continue anyway
    }
    
    return NextResponse.json({
      matches: enhancedMatches,
      creditsUsed: CREDIT_COSTS.job_match
    });
    
  } catch (error) {
    console.error("Error in AI job matching:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}