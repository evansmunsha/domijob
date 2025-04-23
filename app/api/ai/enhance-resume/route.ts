import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { generateAIResponse } from "@/app/utils/openai";
import { prisma } from "@/app/utils/db";

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id ?? null;
    const { resumeText, targetJobTitle } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    // Create a prompt for the AI
    const systemPrompt = `You are an expert resume writer and career coach with deep expertise in optimizing resumes for ATS systems and human recruiters. Analyze the provided resume and suggest improvements that will make it more effective for job applications, especially for the target job title if provided.`;
    
    const userPrompt = `Resume:
${resumeText}

${targetJobTitle ? `Target Job Title: ${targetJobTitle}` : 'No specific target job title provided.'}

Analyze this resume and provide suggestions for improvement. Focus on:
1. Clarity and impact of bullet points
2. Keywords and skills that should be highlighted
3. Formatting issues or inconsistencies
4. Quantifiable achievements that could be better presented
5. Modern resume best practices and ATS optimization

Return the suggestions in JSON format:
{
  "overview": "Brief assessment of the resume's current state",
  "strengths": ["Strength 1", "Strength 2", ...],
  "weaknesses": ["Weakness 1", "Weakness 2", ...],
  "suggestions": [
    {
      "section": "Section name (e.g., Work Experience, Skills)",
      "improvements": ["Specific improvement suggestion 1", "Specific improvement suggestion 2", ...]
    },
    ...
  ],
  "keywords": ["Industry-specific keyword 1", "Industry-specific keyword 2", ...],
  "atsScore": 65 // Estimated ATS-friendliness score (0-100)
}`;

    // Call OpenAI
    const result = await generateAIResponse(
      userId,
      "resume_enhancement",
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
          where: { userId },
          data: { resume: resumeText }
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Resume enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance resume" },
      { status: 500 }
    );
  }
} 