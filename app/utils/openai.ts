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

// Create a service to handle all OpenAI operations
export async function getAISettings() {
  const [enabledSetting, modelSetting, maxTokensSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "ai.enabled" } }),
    prisma.setting.findUnique({ where: { key: "ai.model" } }),
    prisma.setting.findUnique({ where: { key: "ai.maxTokens" } }),
  ])

  return {
    enabled: enabledSetting?.value === "true",
    model: modelSetting?.value || "gpt-4o-mini", // Default to gpt-4o-mini
    maxTokens: maxTokensSetting ? Number.parseInt(maxTokensSetting.value) : 1000,
  }
}

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

export async function getCachedResponse(userId: string, type: string, prompt: string) {
  // Check cache for recent, identical requests
  const cachedResponse = await prisma.aIGeneratedContent.findFirst({
    where: {
      userId,
      type,
      prompt,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return cachedResponse
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

// Function to handle credit deduction for AI usage
async function useCredits(userId: string | null, endpoint: string): Promise<boolean> {
  if (!userId) {
    // Handle anonymous users through the unified credit handler
    // This would typically be handled by the API route that calls this function
    return true
  }

  try {
    // Use the existing deductCredits function for authenticated users
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
  } = {},
) {
  const settings = await getAISettings()
  const didDeduct = !options.skipCreditCheck && userId ? await useCredits(userId, endpoint) : true

  if (!settings.enabled) {
    throw new Error("AI features are currently disabled")
  }

  if (!didDeduct) {
    throw new Error("You've used all your free credits. Please sign up or buy more credits.")
  }

  // Check cache if applicable
  let cachedResponse
  if (options.cache && userId) {
    cachedResponse = await getCachedResponse(userId, endpoint, userPrompt)
    if (cachedResponse) {
      return JSON.parse(cachedResponse.response)
    }
  }

  // Use faster model for job_description_enhancement to speed up response
  const modelName = endpoint === "job_description_enhancement" ? "gpt-4o-mini" : settings.model
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
    },
  )

  // Calculate token usage and cost
  const promptTokens = response.usage?.prompt_tokens || 0
  const completionTokens = response.usage?.completion_tokens || 0
  const totalTokens = promptTokens + completionTokens

  // Get pricing for the model
  const pricing = MODEL_PRICING[modelName as keyof typeof MODEL_PRICING] || MODEL_PRICING["gpt-4o-mini"]

  // Calculate cost in USD
  const cost = (promptTokens * pricing.input + completionTokens * pricing.output) / 1000000

  // Log usage
  if (userId) {
    await logAIUsage(userId, endpoint, totalTokens, cost)
  }

  // Parse and cache response
  const content = response.choices[0].message.content || "{}"
  const parsedResponse = JSON.parse(content)

  if (options.cache && userId) {
    await saveAIResponse(userId, endpoint, userPrompt, content)
  }

  return parsedResponse
}
