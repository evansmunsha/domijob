//app/utils/credits.ts


import { prisma } from "./db"

// Define credit costs per feature
export const CREDIT_COSTS = {
  job_match: 10,
  resume_enhancement: 15,
  job_description_enhancement: 20,
  file_parsing: 5, // Adding file parsing with a lower cost since it's a simpler operation
}

// Credit packages available for purchase
export const CREDIT_PACKAGES = {
  basic: { credits: 50, price: 499, name: "Basic AI Credits" },
  standard: { credits: 150, price: 1299, name: "Standard AI Credits" },
  premium: { credits: 500, price: 2999, name: "Premium AI Credits" },
}

// Check if user has enough credits for the requested AI feature
export async function checkUserCredits(userId: string, endpoint: string): Promise<boolean> {
  const creditCost = CREDIT_COSTS[endpoint as keyof typeof CREDIT_COSTS] || 10

  const userCredits = await prisma.userCredits.findUnique({
    where: { userId },
  })

  return userCredits ? userCredits.balance >= creditCost : false
}

// Deduct credits for AI feature usage
export async function deductCredits(userId: string, endpoint: string): Promise<void> {
  const creditCost = CREDIT_COSTS[endpoint as keyof typeof CREDIT_COSTS] || 10

  const userCredits = await prisma.userCredits.findUnique({
    where: { userId },
  })

  if (!userCredits || userCredits.balance < creditCost) {
    throw new Error("Insufficient credits to use this AI feature. Please purchase more credits.")
  }

  await prisma.userCredits.update({
    where: { userId },
    data: {
      balance: userCredits.balance - creditCost,
    },
  })

  // Log the credit usage
  await prisma.creditTransaction.create({
    data: {
      userId,
      amount: -creditCost,
      type: "usage",
      description: `Used ${creditCost} credits for ${endpoint}`,
    },
  })
}

// Add credits to user account with source tracking
export async function addCredits(
  userId: string,
  amount: number,
  source: "purchase" | "signup_bonus" | "promotional" | "refund" = "purchase",
): Promise<void> {
  // Use a transaction to ensure both operations succeed or fail together
  await prisma.$transaction(async (tx: { userCredits: { upsert: (arg0: { where: { userId: string }; update: { balance: { increment: number } }; create: { userId: string; balance: number } }) => any }; creditTransaction: { create: (arg0: { data: { userId: string; amount: number; type: "purchase" | "signup_bonus" | "promotional" | "refund"; description: string } }) => any } }) => {
    // Add or update user credits
    await tx.userCredits.upsert({
      where: { userId },
      update: {
        balance: { increment: amount },
      },
      create: {
        userId,
        balance: amount,
      },
    })

    // Log the credit transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: amount,
        type: source,
        description: getTransactionDescription(amount, source),
      },
    })
  })
}

// Helper to generate transaction descriptions
function getTransactionDescription(amount: number, source: string): string {
  switch (source) {
    case "signup_bonus":
      return `Received ${amount} free credits as new user bonus`
    case "purchase":
      return `Purchased ${amount} credits`
    case "promotional":
      return `Received ${amount} promotional credits`
    case "refund":
      return `Refunded ${amount} credits`
    default:
      return `Added ${amount} credits`
  }
}

// Get user's current credit balance
export async function getUserCredits(userId: string): Promise<number> {
  const userCredits = await prisma.userCredits.findUnique({
    where: { userId },
  })

  return userCredits?.balance || 0
}

// Check if user has received signup bonus
export async function hasReceivedSignupBonus(userId: string): Promise<boolean> {
  const bonusTransaction = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: "signup_bonus",
    },
  })

  return !!bonusTransaction
}

// Check if a feature can be used with anonymous credits
export function canUseWithAnonymousCredits(feature: string): boolean {
  // Define which features can be used anonymously
  const anonymousFeatures = ["job_match", "resume_enhancement"]
  return anonymousFeatures.includes(feature)
}

// Get credit cost for a feature
export function getFeatureCreditCost(feature: string): number {
  return CREDIT_COSTS[feature as keyof typeof CREDIT_COSTS] || 10
}
// utils/credits/handleCreditCharge.ts
