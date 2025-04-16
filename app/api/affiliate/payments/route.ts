import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Check if there are pending earnings
    if (affiliate.pendingEarnings <= 0) {
      return NextResponse.json({ error: "No pending earnings to withdraw" }, { status: 400 })
    }

    // Create payment request
    const payment = await prisma.affiliatePayment.create({
      data: {
        affiliateId: affiliate.id,
        amount: affiliate.pendingEarnings,
        paymentMethod: "BANK_TRANSFER", // Default payment method
        status: "PENDING"
      }
    })

    // Update affiliate earnings
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        pendingEarnings: 0
      }
    })

    return NextResponse.json({
      message: "Payment request created successfully",
      paymentId: payment.id
    })
  } catch (error) {
    console.error("[AFFILIATE_PAYMENT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Get payments separately
    const payments = await prisma.affiliatePayment.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      payments
    })
  } catch (error) {
    console.error("[AFFILIATE_PAYMENTS]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 