import { auth } from "@/app/utils/auth"
import { CREDIT_PACKAGES } from "@/app/utils/credits"
import { prisma } from "@/app/utils/db"
import { stripe } from "@/app/utils/stripe"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { packageId } = body
    console.log("🟡 packageId received:", packageId)

    const session = await auth()
    if (!session?.user?.id) {
      console.log("🔴 No user session found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    const selectedPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]

    if (!selectedPackage) {
      console.log("🔴 Invalid package ID:", packageId)
      return NextResponse.json({ error: "Invalid package selected" }, { status: 400 })
    }

    let stripeCustomerId = session.user.stripeCustomerId

    if (!stripeCustomerId) {
      console.log("🟡 Creating Stripe customer for user:", session.user.email)
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
      })

      stripeCustomerId = customer.id

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customer.id },
        })
      } catch (err) {
        console.error("🔴 Error updating user with Stripe ID:", err)
        return NextResponse.json({ error: "Failed to link Stripe account" }, { status: 500 })
      }
    }

    console.log("🟢 Creating Stripe checkout session")

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits} AI credits`,
              images: [
                "https://pve1u6tfz1.ufs.sh/f/Ae8VfpRqE7c0gFltIEOxhiBIFftvV4DTM8a13LU5EyzGb2SQ",
              ],
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

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("🔴 Error in checkout session:", error.message, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/* export async function purchaseAICredits(packageId: string) {
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
  } */