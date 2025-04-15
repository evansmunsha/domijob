import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { amount, paymentMethod } = body

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 })
    }

    // Get affiliate data
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Check if pending earnings are sufficient
    if (affiliate.pendingEarnings < amount) {
      return NextResponse.json({ error: "Insufficient pending earnings" }, { status: 400 })
    }

    // Create payout record
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        paymentMethod,
        status: "PENDING",
      },
    })

    // Update affiliate earnings
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        pendingEarnings: {
          decrement: amount,
        },
        paidEarnings: {
          increment: amount,
        },
      },
    })

    return NextResponse.json({
      message: "Payout request created successfully",
      payout: {
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        createdAt: payout.createdAt,
      },
    })
  } catch (error) {
    console.error("[AFFILIATE_PAYOUT]", error)
    return NextResponse.json({ error: "Failed to process payout" }, { status: 500 })
  }
} 