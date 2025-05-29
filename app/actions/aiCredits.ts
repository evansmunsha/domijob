// Action to add free signup credits for new users

import { redirect } from "next/navigation"
import { prisma } from "../utils/db"
import { stripe } from "../utils/stripe"
import { CREDIT_PACKAGES } from "../utils/credits"
import { auth } from "../utils/auth"

const FREE_SIGNUP_CREDITS = 50

/**
 * Checks if a user has already received their free signup credits
 * @param userId The user ID to check
 * @returns True if the user has already received free credits, false otherwise
 */
async function hasReceivedFreeCredits(userId: string): Promise<boolean> {
  // Check if there's a credit transaction with type "signup_bonus" for this user
  const bonusTransaction = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: "signup_bonus",
    },
  })

  return !!bonusTransaction
}

export async function addFreeSignupCredits(userId: string, guestCredits = 0) {
  // Check if user already received free credits
  const alreadyReceived = await hasReceivedFreeCredits(userId)

  if (alreadyReceived) {
    return false // User already received free credits
  }

  // Calculate total credits: 50 free signup credits + any remaining guest credits
  const totalCredits = FREE_SIGNUP_CREDITS + guestCredits

  // Use a transaction to ensure both operations succeed or fail together
  await prisma.$transaction(async (tx) => {
    // Add credits to user's balance
    await tx.userCredits.upsert({
      where: { userId },
      update: {
        balance: { increment: totalCredits },
      },
      create: {
        userId,
        balance: totalCredits,
      },
    })

    // Log the transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: FREE_SIGNUP_CREDITS,
        type: "signup_bonus",
        description: `Received ${FREE_SIGNUP_CREDITS} free credits as new user bonus`,
      },
    })

    // If there were guest credits, log those separately
    if (guestCredits > 0) {
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: guestCredits,
          type: "guest_transfer",
          description: `Transferred ${guestCredits} remaining guest credits`,
        },
      })
    }
  })

  return true
}

/**
 * Gets the credit status for a user, including balance and whether they're a new user
 */
export async function getUserCreditStatus() {
  try {
    // Get the user's credit balance
    const response = await fetch("/api/credits")
    if (!response.ok) throw new Error("Failed to fetch credits")
    const data = await response.json()

    // Check if this is a new user (has exactly 50 credits and is not a guest)
    const isNewUser = !data.isGuest && data.credits === 50

    // Get recent transactions if available
    let transactions = []
    try {
      const txResponse = await fetch("/api/credits/transactions")
      if (txResponse.ok) {
        const txData = await txResponse.json()
        transactions = txData.transactions || []
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }

    return {
      balance: data.credits || 0,
      isNewUser,
      isGuest: data.isGuest || false,
      transactions,
    }
  } catch (error) {
    console.error("Error getting credit status:", error)
    return {
      balance: 0,
      isNewUser: false,
      isGuest: true,
      transactions: [],
    }
  }
}

/**
 * Gets the user's credit balance
 */
export async function getUserCreditBalance() {
  try {
    const { balance } = await getUserCreditStatus()
    return balance
  } catch (error) {
    console.error("Error getting credit balance:", error)
    return 0
  }
}
// Action to purchase AI credits
export async function purchaseAICredits(packageId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("You must be logged in to purchase credits")
  }
  
  const userId = session.user.id
  
  // Validate package selection
  const selectedPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]
  if (!selectedPackage) {
    throw new Error("Invalid credit package selected")
  }
  
  // Get or create Stripe customer
  let stripeCustomerId = session.user.stripeCustomerId
  
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name || undefined,
    })
    
    stripeCustomerId = customer.id
    
    // Save the Stripe customer ID to the user
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    })
  }
  
  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          product_data: {
            name: selectedPackage.name,
            description: `${selectedPackage.credits} AI credits for premium features`,
            images: ["https://pve1u6tfz1.ufs.sh/f/Ae8VfpRqE7c0gFltIEOxhiBIFftvV4DTM8a13LU5EyzGb2SQ"],
          },
          currency: "USD",
          unit_amount: selectedPackage.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      type: "ai_credits",
      packageId,
      credits: selectedPackage.credits.toString(),
      userId
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/ai-credits/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/ai-credits/cancel`,
  })
  
  if (!checkoutSession.url) {
    throw new Error("Failed to create checkout session")
  }
  
  return redirect(checkoutSession.url)
}

