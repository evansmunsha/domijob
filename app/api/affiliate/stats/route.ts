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
      where: { userId: session.user.id },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Calculate stats
    const totalReferrals = await prisma.affiliateReferral.count({
      where: { affiliateId: affiliate.id }
    })

    const activeReferrals = await prisma.affiliateReferral.count({
      where: {
        affiliateId: affiliate.id,
        status: "PENDING"
      }
    })

    const convertedReferrals = await prisma.affiliateReferral.count({
      where: {
        affiliateId: affiliate.id,
        status: "CONVERTED"
      }
    })

    const conversionRate = totalReferrals > 0
      ? Math.round((convertedReferrals / totalReferrals) * 100)
      : 0

    const stats = {
      totalEarnings: affiliate.totalEarnings,
      pendingEarnings: affiliate.pendingEarnings,
      paidEarnings: affiliate.paidEarnings,
      totalReferrals,
      activeReferrals,
      conversionRate
    }

    return NextResponse.json({
      stats,
      referrals: affiliate.referrals,
      affiliateCode: affiliate.code
    })
  } catch (error) {
    console.error("[AFFILIATE_STATS]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 