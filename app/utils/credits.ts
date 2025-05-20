//(mainLayout)/utils/credits.ts



import { prisma } from "./db";

// Define credit costs per feature
export const CREDIT_COSTS = {
  "job_match": 10,
  "resume_enhancement": 15,
  "job_description_enhancement": 20
};

// Credit packages available for purchase
export const CREDIT_PACKAGES = {
  "basic": { credits: 50, price: 499, name: "Basic AI Credits" },
  "standard": { credits: 150, price: 1299, name: "Standard AI Credits" },
  "premium": { credits: 500, price: 2999, name: "Premium AI Credits" }
};

// Check if user has enough credits for the requested AI feature
export async function checkUserCredits(userId: string, endpoint: string): Promise<boolean> {
  const creditCost = CREDIT_COSTS[endpoint as keyof typeof CREDIT_COSTS] || 10;
  
  const userCredits = await prisma.userCredits.findUnique({
    where: { userId }
  });
  
  return userCredits ? userCredits.balance >= creditCost : false;
}

// Deduct credits for AI feature usage
export async function deductCredits(userId: string, endpoint: string): Promise<void> {
  const creditCost = CREDIT_COSTS[endpoint as keyof typeof CREDIT_COSTS] || 10;
  
  const userCredits = await prisma.userCredits.findUnique({
    where: { userId }
  });
  
  if (!userCredits || userCredits.balance < creditCost) {
    throw new Error("Insufficient credits to use this AI feature. Please purchase more credits.");
  }
  
  await prisma.userCredits.update({
    where: { userId },
    data: { 
      balance: userCredits.balance - creditCost 
    }
  });
}

// Add credits to user account
export async function addCredits(userId: string, amount: number): Promise<void> {
  await prisma.userCredits.upsert({
    where: { userId },
    update: { 
      balance: { increment: amount } 
    },
    create: {
      userId,
      balance: amount
    }
  });
}

// Get user's current credit balance
export async function getUserCredits(userId: string): Promise<number> {
  const userCredits = await prisma.userCredits.findUnique({
    where: { userId }
  });
  
  return userCredits?.balance || 0;
}