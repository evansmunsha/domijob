import { NextResponse } from "next/server";
import { generateAIResponse } from "@/app/utils/openai";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { cookies } from "next/headers";
import { CREDIT_COSTS } from "@/app/utils/credits";

// Constants
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

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

/**
 * Handles credit charging for both authenticated and anonymous users
 */
async function handleCreditCharge(featureType: keyof typeof CREDIT_COSTS | string) {
  // Get credit cost for this feature
  const creditCost = CREDIT_COSTS[featureType as keyof typeof CREDIT_COSTS] || 10;

  // Check if user is authenticated
  const session = await auth();
  const userId = session?.user?.id;

  // Handle authenticated user
  if (userId) {
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId },
    });

    if (!userCredits || userCredits.balance < creditCost) {
      throw new Error("Insufficient credits. Please purchase more credits to continue.");
    }

    // Deduct credits using a transaction
    await prisma.$transaction(async (tx) => {
      // Update user's credit balance
      await tx.userCredits.update({
        where: { userId },
        data: { balance: userCredits.balance - creditCost }
      });
      
      // Log the transaction if the table exists
      try {
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: -creditCost,
            type: "usage",
            description: `Used ${creditCost} credits for ${featureType}`
          }
        });
      } catch (error) {
        // If creditTransaction table doesn't exist, just continue
        console.log("Note: Credit transaction logging skipped");
      }
    });
    
    return {
      userId,
      isGuest: false,
      creditsUsed: creditCost,
      remainingCredits: userCredits.balance - creditCost
    };
  } else {
    // Anonymous user - use cookie credits
    const cookieStore = await cookies();
    const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
    let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
    
    // Validate guest credits
    if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;
    
    if (guestCredits < creditCost) {
      throw new Error("You've used all your free credits. Sign up to get 50 more free credits!");
    }
    
    // Update guest credits
    const updatedCredits = guestCredits - creditCost;
    cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return {
      userId: "guest",
      isGuest: true,
      creditsUsed: creditCost,
      remainingCredits: updatedCredits
    };
  }
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
      if (error instanceof Error) {
        return NextResponse.json({ 
          error: error.message,
          requiresSignup: error.message.includes("Sign up to get")
        }, { status: 402 });
      }
      return NextResponse.json({ error: "Credit check failed" }, { status: 402 });
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
          } catch (parseError) {
            // Parsing error, but we can continue with the string as-is
          }
        }
      } catch (formatError) {
        console.error("Error formatting description:", formatError);
        // Continue with the original result
      }

      return NextResponse.json({
        debugRaw,
        enhancedDescription: result.enhancedDescription,
        titleSuggestion: result.titleSuggestion,
        creditsUsed: creditInfo.creditsUsed,
        remainingCredits: creditInfo.remainingCredits,
        isGuest: creditInfo.isGuest
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