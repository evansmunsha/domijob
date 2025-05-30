// utils/openai.ts
import OpenAI from "openai";
import { prisma } from "@/app/utils/db"
import { deductCredits } from "./credits"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Load AI system settings from DB
export async function getAISettings() {
  const [enabledSetting, modelSetting, maxTokensSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "ai.enabled" } }),
    prisma.setting.findUnique({ where: { key: "ai.model" } }),
    prisma.setting.findUnique({ where: { key: "ai.maxTokens" } }),
  ])

  return {
    enabled: enabledSetting?.value === "true",
    model: modelSetting?.value || "gpt-4o-mini",
    maxTokens: Number(maxTokensSetting?.value || 1000),
  }
}

// Save AI usage for analytics/billing
export async function logAIUsage(userId: string | null, endpoint: string, tokenCount: number, cost: number) {
  await prisma.aIUsageLog.create({ data: { userId, endpoint, tokenCount, cost } })
}

// Cache helpers
export async function getCachedResponse(userId: string, type: string, prompt: string) {
  return await prisma.aIGeneratedContent.findFirst({
    where: {
      userId,
      type,
      prompt,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function saveAIResponse(userId: string, type: string, prompt: string, response: string) {
  await prisma.aIGeneratedContent.create({
    data: { userId, type: type, prompt, response },
  })
}

// Deduct credits unless flagged or guest
async function useCredits(userId: string | null, endpoint: string): Promise<boolean> {
  if (!userId) return true
  try {
    await deductCredits(userId, endpoint)
    return true
  } catch (err) {
    console.error("Credit deduction failed:", err)
    return false
  }
}


export async function generateAIResponse(
  userId: string,
  featureName: string,
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    retries?: number;
    skipCreditCheck?: boolean;
  } = {}
): Promise<any> {
  const { temperature = 0.2, retries = 2 } = options;

  console.log("🧠 OpenAI request", {
    userId,
    featureName,
    temperature,
  });

  let lastError: any;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // or "gpt-4-turbo"
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        //response_format: "json",  Enforces valid JSON if supported
      });

      const raw = response.choices[0].message?.content?.trim();

      // Try parsing if it's a string response
      const parsed = raw ? JSON.parse(raw) : null;

      console.log("✅ OpenAI parsed response", parsed);

      return parsed;
    } catch (err: any) {
      console.error(`❌ OpenAI error (attempt ${attempt}):`, err);
      lastError = err;

      // On final attempt, throw
      if (attempt === retries + 1) {
        throw err;
      }

      // Optional: Delay before retrying
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  throw lastError;
}

