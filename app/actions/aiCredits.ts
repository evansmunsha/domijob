"use server"

import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"
import { stripe } from "@/app/utils/stripe"
import { prisma } from "@/app/utils/db"
import { CREDIT_PACKAGES } from "@/app/utils/credits"

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
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  let stripeCustomerId = userRecord?.stripeCustomerId;

  // Validate or create Stripe customer
  if (stripeCustomerId) {
    try {
      await stripe.customers.retrieve(stripeCustomerId)
    } catch (error: any) {
      if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
        const customer = await stripe.customers.create({
          email: session.user.email!,
          name: session.user.name || undefined,
        })
        stripeCustomerId = customer.id
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customer.id },
        })
      } else {
        throw error
      }
    }
  } else {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name || undefined,
    })
    stripeCustomerId = customer.id
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

// Action to get current user's credit balance
export async function getUserCreditBalance() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return 0
  }
  
  const userCredits = await prisma.userCredits.findUnique({
    where: { userId: session.user.id }
  })
  
  return userCredits?.balance || 0
} 