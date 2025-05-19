import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth" // ✅ This uses your exported auth()
import { prisma } from "@/app/utils/db"

export async function POST(req: NextRequest) {
  const session = await auth() // ✅ Use this instead of getServerSession()

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const referredUserId = session.user.id

  try {
    // 1. Find the pending referral
    const referral = await prisma.affiliateReferral.findFirst({
      where: {
        referredUserId,
        status: "PENDING"
      }
    })

    if (!referral) {
      return NextResponse.json({ message: "No referral found." }, { status: 404 })
    }

    const commissionAmount = 5.0 // ✅ Static for now

    // 2. Mark referral as converted
    await prisma.affiliateReferral.update({
      where: { id: referral.id },
      data: {
        status: "CONVERTED",
        commissionAmount,
        convertedAt: new Date()
      }
    })

    // 3. Update affiliate's stats
    await prisma.affiliate.update({
      where: { id: referral.affiliateId },
      data: {
        pendingEarnings: {
          increment: commissionAmount
        },
        conversionCount: {
          increment: 1
        }
      }
    })

    // 4. Optionally mark clicks as converted
    await prisma.affiliateClick.updateMany({
      where: {
        affiliateId: referral.affiliateId,
        converted: false
      },
      data: {
        converted: true,
        convertedAt: new Date()
      }
    })

    return NextResponse.json({ message: "Conversion tracked." }, { status: 200 })
  } catch (error) {
    console.error("Conversion error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
