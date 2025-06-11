// /app/utils/useCredits.ts

import { cookies } from "next/headers";
import { prisma } from "@/app/utils/db";
import { CREDIT_COSTS } from "@/app/utils/credits";

const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

export async function useCredits(userId: string | null, action: keyof typeof CREDIT_COSTS) {
  const cost = CREDIT_COSTS[action];
  if (!cost) throw new Error(`Unknown credit cost for action: ${action}`);

  if (userId) {
    // Authenticated user
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
    if (!user || user.credits < cost) {
      throw new Error("Insufficient credits");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    });

    return { userType: "authenticated", creditsUsed: cost, remainingCredits: user.credits - cost };
  }

  // Guest user
  const cookieStore = await cookies();
  const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
  let guestCredits = cookie ? parseInt(cookie.value || "0", 10) : MAX_GUEST_CREDITS;

  if (guestCredits < cost) {
    throw new Error("You have 0 credits left. Please sign up to continue.");
  }

  const remaining = guestCredits - cost;
  cookieStore.set(GUEST_CREDIT_COOKIE, remaining.toString(), {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { userType: "guest", creditsUsed: cost, remainingCredits: remaining };
}
