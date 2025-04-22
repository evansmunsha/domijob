import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { generateAIResponse } from "@/app/utils/openai";

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id ?? null;
    const { jobTitle, jobDescription, industry, location } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // Create a prompt for the AI
    const systemPrompt = `You are an expert job description writer. Enhance the provided job description to make it more attractive to candidates. Maintain the original requirements and responsibilities, but improve clarity, organization, and appeal. Return a JSON object with the enhanced description and optional improvements for the job title.`;
    
    const userPrompt = `Job Title: ${jobTitle || "Not specified"}
Industry: ${industry || "Not specified"}
Location: ${location || "Not specified"}

Original Job Description:
${jobDescription}

Enhance this job description to make it more appealing to qualified candidates. Keep a similar length but improve the organization with clear sections for:

1. Company introduction
2. Role overview
3. Key responsibilities 
4. Required qualifications
5. Benefits/perks
6. How to apply

Return the result as JSON with these fields:
{
  "enhancedDescription": "The improved job description with better structure and language",
  "titleSuggestion": "An optional improved job title if the original could be better"
}`;

    // Call OpenAI
    const result = await generateAIResponse(
      userId,
      "job_description_enhancement",
      systemPrompt,
      userPrompt,
      { cache: true }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Job enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance job description" },
      { status: 500 }
    );
  }
} 