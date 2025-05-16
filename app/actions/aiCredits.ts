"use server"

import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"
import { stripe } from "@/app/utils/stripe"
import { prisma } from "@/app/utils/db"
import { CREDIT_PACKAGES } from "@/app/utils/credits"

// Constants
const FREE_SIGNUP_CREDITS = 50

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

  // Get user from database to access stripeCustomerId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Get or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email || session.user.email!,
      name: user.name || session.user.name || undefined,
    })

    stripeCustomerId = customer.id

    // Save the Stripe customer ID to the user
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
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
      userId,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/ai-credits/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/ai-credits/cancel`,
  })

  if (!checkoutSession.url) {
    throw new Error("Failed to create checkout session")
  }

  return redirect(checkoutSession.url)
}

// Action to get current user's credit balance
export async function getUserCreditBalance() {
  const session = await auth()

  if (!session?.user?.id) {
    return 0
  }

  const userCredits = await prisma.userCredits.findUnique({
    where: { userId: session.user.id },
  })

  return userCredits?.balance || 0
}

// Action to check if user has received free signup credits
export async function hasReceivedFreeCredits(userId: string) {
  const transaction = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: "signup_bonus",
    },
  })

  return !!transaction
}

// Action to add free signup credits for new users
export async function addFreeSignupCredits(userId: string) {
  // Check if user already received free credits
  const alreadyReceived = await hasReceivedFreeCredits(userId)

  if (alreadyReceived) {
    return false // User already received free credits
  }

  // Use a transaction to ensure both operations succeed or fail together
  await prisma.$transaction(async (tx) => {
    // Add credits to user's balance
    await tx.userCredits.upsert({
      where: { userId },
      update: {
        balance: { increment: FREE_SIGNUP_CREDITS },
      },
      create: {
        userId,
        balance: FREE_SIGNUP_CREDITS,
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
  })

  return true
}

// Action to get user's credit status including transaction history
export async function getUserCreditStatus() {
  const session = await auth()

  if (!session?.user?.id) {
    return { balance: 0, isNewUser: false, transactions: [] }
  }

  const userId = session.user.id

  // Get user's credit balance
  const userCredits = await prisma.userCredits.findUnique({
    where: { userId },
  })

  // Get signup bonus transaction if it exists
  const signupBonus = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: "signup_bonus",
    },
  })

  // Get recent transactions
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  // A user is considered "new" if they have the signup bonus
  // and haven't made any purchases yet
  const hasMadePurchase = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: "purchase",
    },
  })

  return {
    balance: userCredits?.balance || 0,
    isNewUser: !!signupBonus && !hasMadePurchase,
    transactions,
  }
}
