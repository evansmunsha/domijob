import { NextResponse } from "next/server";
import { generateAIResponse } from "@/app/utils/openai";
import { CREDIT_COSTS } from "@/app/utils/credits";
import { handleCreditCharge } from "@/app/utils/credits/credit-handler";

// Helpers
function convertTiptapToText(doc: any): string {
  if (!doc?.content) return "";
  let text = "";
  function traverse(node: any) {
    if (node.type === 'text' && typeof node.text === 'string') {
      text += node.text;
    }
    if (node.content) {
      for (const child of node.content) {
        traverse(child);
      }
    }
    if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type)) {
      text += '\n';
    }
  }
  for (const node of doc.content) {
    traverse(node);
  }
  return text.trim();
}

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
    const { jobTitle, jobDescription, industry, location } = await req.json();
    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // ✅ Credit handling (guest or user)
    let creditInfo;
    try {
      creditInfo = await handleCreditCharge("job_description_enhancement");
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }

    const systemPrompt = `You are an expert job description writer...`; // Keep the rest as-is
    const userPrompt = `Job Title: ${jobTitle || "Not specified"}\nIndustry: ${industry || "Not specified"}...`; // Your full prompt

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
      const result = await generateAIResponse(
        creditInfo.userId,
        "job_description_enhancement",
        systemPrompt,
        userPrompt,
        { cache: true, skipCreditCheck: true, signal: controller.signal }
      );
      clearTimeout(timeout);

      const debugRaw = { ...result };

      try {
        if (typeof result.enhancedDescription === 'object') {
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
      } catch {}

      return NextResponse.json({
        debugRaw,
        enhancedDescription: result.enhancedDescription,
        titleSuggestion: result.titleSuggestion,
        creditsUsed: creditInfo.creditsUsed,
        ...(creditInfo.isGuest && { remainingCredits: creditInfo.remainingCredits })
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 504 });
        }
        console.error("OpenAI API error details:", { name: error.name, message: error.message, stack: error.stack });
        return NextResponse.json({ error: "Failed to enhance job description", details: error.message }, { status: 500 });
      }
      throw error;
    }

  } catch (error) {
    console.error("Job enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance job description", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
