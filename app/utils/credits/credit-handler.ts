// app/utils/credits/handleCreditCharge.ts
import { cookies } from "next/headers";

const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

type CreditChargeResult =
  | { success: true; remainingCredits: number }
  | { success: false; remainingCredits: number; error: string };

export async function handleCreditCharge(cost: number): Promise<CreditChargeResult> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
  let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

  if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

  if (guestCredits < cost) {
    return {
      success: false,
      remainingCredits: guestCredits,
      error: "Insufficient guest credits. Please sign up to continue.",
    };
  }

  const updatedCredits = guestCredits - cost;

  // Update cookie (non-HttpOnly so client can read it too if needed)
  cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return {
    success: true,
    remainingCredits: updatedCredits,
  };
}
