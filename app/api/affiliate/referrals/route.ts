import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { referralId, status } = body

    // Validate required fields
    if (!referralId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["PENDING", "ACTIVE", "CONVERTED", "EXPIRED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get referral data
    const referral = await prisma.affiliateReferral.findUnique({
      where: { id: referralId },
      include: { affiliate: true },
    })

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    // Check if user has permission to update this referral
    if (referral.affiliate.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this referral" }, { status: 403 })
    }

    // Update referral status
    const updatedReferral = await prisma.affiliateReferral.update({
      where: { id: referralId },
      data: { status },
    })

    return NextResponse.json({
      message: "Referral status updated successfully",
      referral: {
        id: updatedReferral.id,
        status: updatedReferral.status,
        updatedAt: updatedReferral.updatedAt,
      },
    })
  } catch (error) {
    console.error("[AFFILIATE_REFERRAL]", error)
    return NextResponse.json({ error: "Failed to update referral status" }, { status: 500 })
  }
} 