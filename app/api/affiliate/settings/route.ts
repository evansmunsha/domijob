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
    const { commissionRate, isActive } = body

    // Validate commission rate
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 1)) {
      return NextResponse.json({ error: "Commission rate must be between 0 and 1" }, { status: 400 })
    }

    // Update affiliate settings
    const affiliate = await prisma.affiliate.update({
      where: { userId: session.user.id },
      data: {
        ...(commissionRate !== undefined && { commissionRate }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      message: "Affiliate settings updated successfully",
      settings: {
        commissionRate: affiliate.commissionRate,
        isActive: affiliate.isActive,
      },
    })
  } catch (error) {
    console.error("[AFFILIATE_SETTINGS]", error)
    return NextResponse.json({ error: "Failed to update affiliate settings" }, { status: 500 })
  }
} 