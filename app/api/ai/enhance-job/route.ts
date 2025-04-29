import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { generateAIResponse } from "@/app/utils/openai";
import { prisma } from "@/app/utils/db";
import { deductCredits, CREDIT_COSTS } from "@/app/utils/credits";

// Function to convert Tiptap document to plain text
function convertTiptapToText(doc: any): string {
  if (!doc?.content) return "";
  let text = "";
  // Recursively traverse all nodes
  function traverse(node: any) {
    if (node.type === 'text' && typeof node.text === 'string') {
      text += node.text;
    }
    if (node.content) {
      for (const child of node.content) {
        traverse(child);
      }
    }
    // Add newline after block-level elements
    if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type)) {
      text += '\n';
    }
  }
  for (const node of doc.content) {
    traverse(node);
  }
  return text.trim();
}

// Flatten structured JSON sections into plaintext
function flattenEnhancedDescription(obj: any): string {
  const lines: string[] = [];
  if (obj.companyIntroduction) lines.push(obj.companyIntroduction);
  if (obj.roleOverview) lines.push(obj.roleOverview);
  if (Array.isArray(obj.keyResponsibilities)) {
    lines.push('Key Responsibilities:');
    obj.keyResponsibilities.forEach((item: string) => lines.push(`- ${item}`));
  }
  if (Array.isArray(obj.requiredQualifications)) {
    lines.push('Required Qualifications:');
    obj.requiredQualifications.forEach((item: string) => lines.push(`- ${item}`));
  }
  if (Array.isArray(obj.benefitsPerks)) {
    lines.push('Benefits/Perks:');
    obj.benefitsPerks.forEach((item: string) => lines.push(`- ${item}`));
  }
  if (obj.howToApply) lines.push(obj.howToApply);
  return lines.join('\n');
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

      // Debug: preserve raw AI result
      const debugRaw = { ...result };

      // Normalize enhancedDescription: convert Tiptap JSON (object or JSON string) to plain text
      try {
        if (typeof result.enhancedDescription === 'object') {
          // Tiptap doc vs. structured sections
          if (result.enhancedDescription.type === 'doc') {
            result.enhancedDescription = convertTiptapToText(result.enhancedDescription);
          } else {
            result.enhancedDescription = flattenEnhancedDescription(result.enhancedDescription);
          }
        } else if (typeof result.enhancedDescription === 'string') {
          try {
            const parsedDoc = JSON.parse(result.enhancedDescription);
            if (parsedDoc?.type === 'doc') {
              result.enhancedDescription = convertTiptapToText(parsedDoc);
            }
          } catch {}
        }
      } catch {
        // leave as-is if parsing fails
      }

      // Return debug and normalized output
      return NextResponse.json({
        debugRaw,
        enhancedDescription: result.enhancedDescription,
        titleSuggestion: result.titleSuggestion,
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