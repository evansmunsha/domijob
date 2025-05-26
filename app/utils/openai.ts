import OpenAI from "openai"
import { prisma } from "@/app/utils/db"
import { deductCredits } from "./credits"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Model pricing constants (per 1M tokens)
const MODEL_PRICING = {
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4": { input: 10, output: 30 },
}

// Load AI settings from DB
export async function getAISettings() {
  const [enabledSetting, modelSetting, maxTokensSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "ai.enabled" } }),
    prisma.setting.findUnique({ where: { key: "ai.model" } }),
    prisma.setting.findUnique({ where: { key: "ai.maxTokens" } }),
  ])

  return {
    enabled: enabledSetting?.value === "true",
    model: modelSetting?.value || "gpt-4o-mini",
    maxTokens: maxTokensSetting ? Number.parseInt(maxTokensSetting.value) : 1000,
  }
}

// Log usage for tracking
export async function logAIUsage(userId: string | null, endpoint: string, tokenCount: number, cost: number) {
  await prisma.aIUsageLog.create({
    data: {
      userId,
      endpoint,
      tokenCount,
      cost,
    },
  })
}

// AI caching helpers
export async function getCachedResponse(userId: string, type: string, prompt: string) {
  return await prisma.aIGeneratedContent.findFirst({
    where: {
      userId,
      type,
      prompt,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function saveAIResponse(userId: string, type: string, prompt: string, response: string) {
  await prisma.aIGeneratedContent.create({
    data: {
      userId,
      type,
      prompt,
      response,
    },
  })
}

// Handle credit deduction
async function useCredits(userId: string | null, endpoint: string): Promise<boolean> {
  if (!userId) return true // Guest credit is handled at API route level

  try {
    await deductCredits(userId, endpoint)
    return true
  } catch (error) {
    console.error("Error deducting credits:", error)
    return false
  }
}

// Main function to interact with OpenAI
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
    throw new Error("AI features are currently disabled")
  }

  const didDeduct = !options.skipCreditCheck && userId ? await useCredits(userId, endpoint) : true

  if (!didDeduct) {
    throw new Error("You've used all your free credits. Please sign up or buy more credits.")
  }

  // Check cache
  if (options.cache && userId) {
    const cached = await getCachedResponse(userId, endpoint, userPrompt)
    if (cached) {
      try {
        return JSON.parse(cached.response)
      } catch {
        // fallback: ignore bad cache
      }
    }
  }

  // Choose model
  const modelName = endpoint === "job_description_enhancement" ? "gpt-4o-mini" : settings.model

  // Call OpenAI
  const response = await openai.chat.completions.create(
    {
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: options.temperature ?? 0.2,
      max_tokens: settings.maxTokens,
    },
    {
      signal: options.signal,
    }
  )

  const promptTokens = response.usage?.prompt_tokens || 0
  const completionTokens = response.usage?.completion_tokens || 0
  const totalTokens = promptTokens + completionTokens

  const pricing = MODEL_PRICING[modelName as keyof typeof MODEL_PRICING] || MODEL_PRICING["gpt-4o-mini"]
  const cost = (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000

  // Log usage
  if (userId) {
    await logAIUsage(userId, endpoint, totalTokens, cost)
  }

  const raw = response.choices[0]?.message?.content || "{}"

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error("Failed to parse OpenAI response:", raw)
    throw new Error("AI response could not be parsed. Try again.")
  }

  if (options.cache && userId) {
    await saveAIResponse(userId, endpoint, userPrompt, raw)
  }

  return parsed
}

