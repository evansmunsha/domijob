import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { nanoid } from "nanoid"
import { prisma } from "@/app/utils/db"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is already an affiliate
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    })

    if (existingAffiliate) {
      return NextResponse.json({ error: "Already registered as affiliate" }, { status: 400 })
    }

    // Generate unique affiliate code
    const affiliateCode = nanoid(8).toUpperCase()

    // Create affiliate record
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: session.user.id,
        code: affiliateCode,
        commissionRate: 0.1, // 10% commission rate
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        conversionCount: 0,
        clickCount: 0
      }
    })

    return NextResponse.json({
      message: "Successfully registered as affiliate",
      affiliateCode: affiliate.code
    })
  } catch (error) {
    console.error("[AFFILIATE_REGISTER]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 