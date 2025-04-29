import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { generateAIResponse } from "@/app/utils/openai";
import { prisma } from "@/app/utils/db";
import { deductCredits, CREDIT_COSTS } from "@/app/utils/credits";

// Function to convert Tiptap document to plain text
function convertTiptapToText(doc: any): string {
  if (!doc?.content) return "";
  
  let text = "";
  
  for (const node of doc.content) {
    if (node.type === "blockquote") {
      for (const block of node.content) {
        if (block.type === "paragraph") {
          for (const content of block.content || []) {
            if (content.type === "text") {
              text += content.text + "\n";
            }
          }
        }
      }
      text += "\n";
    }
  }
  
  return text.trim();
}

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to use this feature" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { jobTitle, jobDescription, industry, location } = await req.json();
    console.log("Enhance-job request body:", { jobTitle, jobDescription, industry, location });

    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // Check if user has enough credits
    try {
      await deductCredits(userId, "job_description_enhancement");
    } catch (error) {
      return NextResponse.json(
        { error: "Insufficient credits to use this feature. Please purchase more credits." },
        { status: 402 }
      );
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
    console.log("Enhance-job prompts:", { systemPrompt, userPrompt });

    // Call OpenAI with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9 second timeout

    try {
      const result = await generateAIResponse(
        userId,
        "job_description_enhancement",
        systemPrompt,
        userPrompt,
        {
          cache: true,
          skipCreditCheck: true,
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      // Convert the Tiptap document to plain text if needed
      if (typeof result.enhancedDescription === 'object') {
        result.enhancedDescription = convertTiptapToText(result.enhancedDescription);
      }

      return NextResponse.json({
        ...result,
        creditsUsed: CREDIT_COSTS.job_description_enhancement
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return NextResponse.json(
            { error: "Request timed out. Please try again." },
            { status: 504 }
          );
        }
        // Log the specific error details
        console.error("OpenAI API error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        return NextResponse.json(
          { 
            error: "Failed to enhance job description",
            details: error.message
          },
          { status: 500 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Job enhancement error:", error);
    return NextResponse.json(
      { 
        error: "Failed to enhance job description",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 