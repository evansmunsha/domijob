import OpenAI from "openai"
import { prisma } from "@/app/utils/db"
import { deductCredits } from "./credits"

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Model pricing per 1M tokens
const MODEL_PRICING = {
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4": { input: 10, output: 30 },
}

// Load AI system settings from DB
export async function getAISettings() {
  const [enabledSetting, modelSetting, maxTokensSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "ai.enabled" } }),
    prisma.setting.findUnique({ where: { key: "ai.model" } }),
    prisma.setting.findUnique({ where: { key: "ai.maxTokens" } }),
  ])

  return {
    enabled: enabledSetting?.value === "true",
    model: modelSetting?.value || "gpt-4o",
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

// Main AI executor
export async function generateAIResponse(
  userId: string | null,
  endpoint: string,
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number
    cache?: boolean
    skipCreditCheck?: boolean
    signal?: AbortSignal
  } = {}
) {
  const settings = await getAISettings()

  if (!settings.enabled) {
    throw new Error("AI features are currently disabled.")
  }

  const shouldDeduct = !options.skipCreditCheck && userId
  const didDeduct = shouldDeduct ? await useCredits(userId, endpoint) : true

  if (!didDeduct) {
    throw new Error("You've used all your free credits. Please sign up or buy more credits.")
  }

  // Return cached result if present
  if (options.cache && userId) {
    const cached = await getCachedResponse(userId, endpoint, userPrompt)
    if (cached) {
      try {
        return JSON.parse(cached.response)
      } catch {
        console.warn("Invalid cached JSON, ignoring...")
      }
    }
  }

  const modelName = endpoint === "job_description_enhancement" ? "gpt-4o-mini" : settings.model

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options.temperature ?? 0.2,
    max_tokens: settings.maxTokens,
  }, {
    signal: options.signal,
  })

  const { prompt_tokens = 0, completion_tokens = 0 } = response.usage || {}
  const totalTokens = prompt_tokens + completion_tokens
  const pricing = MODEL_PRICING[modelName as keyof typeof MODEL_PRICING]
  const cost = (prompt_tokens * pricing.input + completion_tokens * pricing.output) / 1_000_000

  if (userId) {
    await logAIUsage(userId, endpoint, totalTokens, cost)
  }

  const raw = response.choices[0]?.message?.content || "{}"

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error("Failed to parse OpenAI response:", raw)
    throw new Error("AI response could not be parsed. Please try again.")
  }

  if (options.cache && userId) {
    await saveAIResponse(userId, endpoint, userPrompt, raw)
  }

  return parsed
}
