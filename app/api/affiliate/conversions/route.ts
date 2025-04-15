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
    const { referralId, conversionType, amount } = body

    // Validate required fields
    if (!referralId || !conversionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get referral and affiliate data
    const referral = await prisma.affiliateReferral.findUnique({
      where: { id: referralId },
      include: { affiliate: true },
    })

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    // Check if affiliate is active
    if (!referral.affiliate.isActive) {
      return NextResponse.json({ error: "Affiliate is not active" }, { status: 400 })
    }

    // Calculate commission
    const commission = amount * referral.affiliate.commissionRate

    // Create conversion record
    const conversion = await prisma.affiliateConversion.create({
      data: {
        referralId,
        conversionType,
        amount,
        commission,
        status: "PENDING",
      },
    })

    // Update affiliate earnings
    await prisma.affiliate.update({
      where: { id: referral.affiliateId },
      data: {
        totalEarnings: {
          increment: commission,
        },
        pendingEarnings: {
          increment: commission,
        },
      },
    })

    return NextResponse.json({
      message: "Conversion tracked successfully",
      conversion: {
        id: conversion.id,
        amount: conversion.amount,
        commission: conversion.commission,
        status: conversion.status,
        createdAt: conversion.createdAt,
      },
    })
  } catch (error) {
    console.error("[AFFILIATE_CONVERSION]", error)
    return NextResponse.json({ error: "Failed to track conversion" }, { status: 500 })
  }
} 