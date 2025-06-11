import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { prisma } from "@/app/utils/db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json();
    
    if (!resumeText) {
      return NextResponse.json({ error: "Resume text required" }, { status: 400 });
    }

    // Get jobs exactly like the main API
    const activeJobs = await prisma.jobPost.findMany({
      where: { 
        status: "ACTIVE",
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
      take: 3, // Just test with 3 jobs
    });

    if (activeJobs.length === 0) {
      return NextResponse.json({
        error: "No active jobs found",
        totalJobs: await prisma.jobPost.count(),
        activeJobs: await prisma.jobPost.count({ where: { status: "ACTIVE" } })
      });
    }

    const jobsForPrompt = activeJobs.map(job => ({
      id: job.id,
      title: job.jobTitle,
      company: job.company?.name || "Unknown Company",
      description: job.jobDescription?.length > 500 
        ? job.jobDescription.substring(0, 500) + "..."
        : job.jobDescription || "No description",
      employmentType: job.employmentType || "Full-time"
    }));

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

    const userPrompt = `RESUME:
${resumeText.substring(0, 1000)} // Limit for testing

JOBS:
${jobsForPrompt.map((job, index) => `${index + 1}. ID:${job.id} TITLE:${job.title} DESC:${job.description}`).join('\n')}

Return JSON array for matches >=50 score:`;

    console.log("=== TEST MATCHING DEBUG ===");
    console.log("Jobs found:", activeJobs.length);
    console.log("Resume length:", resumeText.length);
    console.log("System prompt length:", systemPrompt.length);
    console.log("User prompt length:", userPrompt.length);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const aiResponse = response?.choices?.[0]?.message?.content || "";
    console.log("AI Response:", aiResponse);

    let matches = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      matches = JSON.parse(jsonString);
    } catch (parseError) {
      console.log("Parse error:", parseError);
      return NextResponse.json({
        error: "Failed to parse AI response",
        rawResponse: aiResponse,
        jobs: jobsForPrompt,
        parseError: parseError instanceof Error ? parseError.message : "Unknown parse error"
      });
    }

    return NextResponse.json({
      success: true,
      jobsFound: activeJobs.length,
      matches,
      rawResponse: aiResponse,
      usage: response.usage,
      jobs: jobsForPrompt
    });

  } catch (error) {
    console.error("Test matching error:", error);
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
