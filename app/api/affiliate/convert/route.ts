import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get affiliate code from cookie
    const affiliateCode = (await cookies()).get("affiliate_code")?.value
    if (!affiliateCode) {
      return NextResponse.json({ error: "No affiliate code found" }, { status: 400 })
    }

    // Get affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: affiliateCode }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid affiliate code" }, { status: 404 })
    }

    // Calculate commission (example: $10 per conversion)
    const commissionAmount = 10.00 * affiliate.commissionRate

    // Create referral record
    const referral = await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        referredUserId: session.user.id,
        commissionAmount,
        status: "CONVERTED",
        convertedAt: new Date()
      }
    })

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
    })

    // Clear affiliate cookie
    const response = NextResponse.json({
      message: "Successfully recorded conversion",
      referralId: referral.id
    })
    response.cookies.delete("affiliate_code")

    return response
  } catch (error) {
    console.error("[AFFILIATE_CONVERT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 