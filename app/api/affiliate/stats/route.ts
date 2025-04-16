import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get affiliate data
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Get referrals and clicks separately
    const referrals = await prisma.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const clicks = await prisma.affiliateClick.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { timestamp: 'desc' },
      take: 100
    })

    return NextResponse.json({
      code: affiliate.code,
      commissionRate: affiliate.commissionRate,
      totalEarnings: affiliate.totalEarnings,
      pendingEarnings: affiliate.pendingEarnings,
      paidEarnings: affiliate.paidEarnings,
      conversionCount: affiliate.conversionCount,
      clickCount: affiliate.clickCount,
      referrals,
      clicks
    })
  } catch (error) {
    console.error("[AFFILIATE_STATS]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 