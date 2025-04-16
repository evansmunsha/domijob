import { prisma } from "@/app/utils/db";
import { stripe } from "@/app/utils/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();

  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch {
    return new Response("Webhook error", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const customerId = session.customer as string;
    const jobId = session.metadata?.jobId;

    if (!jobId) {
      console.error("No job ID found in session metadata");
      return new Response("No job ID found", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        stripeCustomerId: customerId,
      },
    });

    if (!user) throw new Error("User not found...");

    // Update the job post status to PUBLISHED
    await prisma.jobPost.update({
      where: {
        id: jobId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    // Check for affiliate code in user's cookies
    try {
      // Get the referral code from the user record if it exists
      if (user.referredByCode) {
        const affiliate = await prisma.affiliate.findUnique({
          where: { code: user.referredByCode }
        });

        if (affiliate) {
          // Get job price details to calculate commission
          const job = await prisma.jobPost.findUnique({
            where: { id: jobId }
          });

          if (job) {
            // Find pricing tier for this job
            const jobDuration = job.listingDuration || 30; // Default to 30 days if not specified
            
            // Get the amount from session or fallback to our pricing tiers
            const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
            
            // Calculate commission (10% of job listing price)
            const commissionAmount = amount * affiliate.commissionRate;

            if (commissionAmount > 0) {
              // Create referral record
              await prisma.affiliateReferral.create({
                data: {
                  affiliateId: affiliate.id,
                  referredUserId: user.id,
                  commissionAmount,
                  status: "CONVERTED",
                  convertedAt: new Date()
                }
              });

              // Update affiliate stats
              await prisma.affiliate.update({
                where: { id: affiliate.id },
                data: {
                  totalEarnings: {
                    increment: commissionAmount
                  },
                  pendingEarnings: {
                    increment: commissionAmount
                  },
                  conversionCount: {
                    increment: 1
                  }
                }
              });
            }
          }
        }
      }
    } catch (error) {
      // Log but don't fail the whole webhook
      console.error("Error processing affiliate commission:", error);
    }
  }

  return new Response(null, { status: 200 });
}
