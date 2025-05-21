//(mainLayout)/utils/credits.ts
import { cookies } from "next/headers";
import { prisma } from "./db";

const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;
const COST_PER_REQUEST = 10;



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
// Check if user is anonymous (no userId)
function isAnonymous(userId: string | undefined | null): boolean {
  return !userId;
}
// --- Anonymous Credit Logic ---

export function getAnonymousCredits(): number {
  if (typeof window !== "undefined") {
    const credits = localStorage.getItem("anon_credits");
    return credits ? parseInt(credits) : 50; // Default to 50
  }
  return 0;
}

export function deductAnonymousCredits(endpoint: string): boolean {
  if (typeof window !== "undefined") {
    const cost = CREDIT_COSTS[endpoint as keyof typeof CREDIT_COSTS] || 10;
    const current = getAnonymousCredits();
    if (current >= cost) {
      localStorage.setItem("anon_credits", String(current - cost));
      return true;
    }
  }
  return false;
}

export function resetAnonymousCredits() {
  if (typeof window !== "undefined") {
    localStorage.setItem("anon_credits", "50");
  }
}
export async function useCredits(userId: string | null, endpoint: string): Promise<boolean> {
  if (isAnonymous(userId)) {
    return deductAnonymousCredits(endpoint);
  } else {
    const hasCredits = await checkUserCredits(userId!, endpoint);
    if (!hasCredits) return false;
    await deductCredits(userId!, endpoint);
    return true;
  }
}
// Deduct credits for signed-in user or guest
export async function deductCreditsForUserOrGuest(
  userId: string | null,
  creditType: string
): Promise<{ remainingCredits: number }> {
  if (userId) {
    // Signed-in user: Deduct from DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    if (user.credits < COST_PER_REQUEST) {
      throw new Error("Insufficient credits");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: COST_PER_REQUEST } },
    });

    return { remainingCredits: user.credits - COST_PER_REQUEST };
  } else {
    // Guest user: Deduct from cookie
    const cookieStore = await cookies();
    const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
    let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

    if (guestCredits < COST_PER_REQUEST) {
      throw new Error("Insufficient credits");
    }

    guestCredits -= COST_PER_REQUEST;

    cookieStore.set(GUEST_CREDIT_COOKIE, guestCredits.toString(), {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { remainingCredits: guestCredits };
  }
}



{/**/}