import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get data from request body
    const data = await request.json()
    const { paymentMethod } = data

    // Validate payment method
    if (!paymentMethod || !["paypal", "bank"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      )
    }

    // Get affiliate record
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        pendingEarnings: true,
        paypalEmail: true,
        bankName: true,
        accountName: true,
        accountNumber: true,
        routingNumber: true,
        country: true,
        swiftCode: true
      },
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: "Affiliate account not found" },
        { status: 404 }
      )
    }

    // Check if the payout method is set up
    if (paymentMethod === "paypal" && !affiliate.paypalEmail) {
      return NextResponse.json(
        { error: "PayPal email not set up" },
        { status: 400 }
      )
    }

    if (
      paymentMethod === "bank" &&
      (!affiliate.bankName || !affiliate.accountName || !affiliate.accountNumber)
    ) {
      return NextResponse.json(
        { error: "Bank details not complete" },
        { status: 400 }
      )
    }

    // Get minimum payout amount from settings
    const minPayoutSetting = await prisma.setting.findUnique({
      where: { key: "affiliate.minPayout" },
    })
    const minPayout = minPayoutSetting
      ? parseInt(minPayoutSetting.value, 10)
      : 50

    // Check if pending earnings meet the minimum payout amount
    if (affiliate.pendingEarnings < minPayout) {
      return NextResponse.json(
        {
          error: `You need at least $${minPayout} to request a payout. Current balance: $${affiliate.pendingEarnings.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Check if there is already a pending payment request
    const existingRequest = await prisma.affiliatePayment.findFirst({
      where: {
        affiliateId: affiliate.id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending payment request" },
        { status: 400 }
      )
    }

    // Create payment request
    const paymentRequest = await prisma.affiliatePayment.create({
      data: {
        affiliateId: affiliate.id,
        amount: affiliate.pendingEarnings,
        paymentMethod: paymentMethod.toUpperCase(),
        status: "PENDING",
      },
    })

    // Update affiliate to reset pending earnings
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        pendingEarnings: 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Payment request submitted successfully",
      paymentId: paymentRequest.id,
    })
  } catch (error) {
    console.error("Error creating payment request:", error)
    return NextResponse.json(
      { error: "Failed to create payment request" },
      { status: 500 }
    )
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