import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    })

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get affiliate settings
    const [
      enabledSetting,
      commissionRateSetting,
      minPayoutSetting,
      payoutMethodsSetting
    ] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "affiliate.enabled" } }),
      prisma.setting.findUnique({ where: { key: "affiliate.commissionRate" } }),
      prisma.setting.findUnique({ where: { key: "affiliate.minPayout" } }),
      prisma.setting.findUnique({ where: { key: "affiliate.payoutMethods" } })
    ])

    // Get aggregate statistics
    const totalAffiliates = await prisma.affiliate.count()
    const activeAffiliates = await prisma.affiliate.count({
      where: { conversionCount: { gt: 0 } }
    })
    const totalPayments = await prisma.affiliatePayment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true }
    })

    return NextResponse.json({
      enabled: enabledSetting?.value === "true",
      commissionRate: commissionRateSetting ? parseInt(commissionRateSetting.value, 10) : 10,
      minPayout: minPayoutSetting ? parseInt(minPayoutSetting.value, 10) : 50,
      payoutMethods: payoutMethodsSetting ? JSON.parse(payoutMethodsSetting.value) : ["paypal", "bank_transfer"],
      stats: {
        totalAffiliates,
        activeAffiliates,
        totalCommissionPaid: totalPayments._sum.amount || 0
      }
    })
  } catch (error) {
    console.error("Error getting affiliate settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    })

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { enabled, commissionRate, minPayout, payoutMethods } = data

    // Validate inputs
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return NextResponse.json(
        { error: "Commission rate must be between 0 and 100" },
        { status: 400 }
      )
    }

    if (minPayout !== undefined && minPayout < 0) {
      return NextResponse.json(
        { error: "Minimum payout must be a positive number" },
        { status: 400 }
      )
    }

    if (payoutMethods !== undefined && (!Array.isArray(payoutMethods) || payoutMethods.length === 0)) {
      return NextResponse.json(
        { error: "At least one payout method must be specified" },
        { status: 400 }
      )
    }

    // Update settings using upsert to ensure they exist
    const updates = []

    if (enabled !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "affiliate.enabled" },
          update: { value: enabled.toString() },
          create: { key: "affiliate.enabled", value: enabled.toString() }
        })
      )
    }

    if (commissionRate !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "affiliate.commissionRate" },
          update: { value: commissionRate.toString() },
          create: { key: "affiliate.commissionRate", value: commissionRate.toString() }
        })
      )
    }

    if (minPayout !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "affiliate.minPayout" },
          update: { value: minPayout.toString() },
          create: { key: "affiliate.minPayout", value: minPayout.toString() }
        })
      )
    }

    if (payoutMethods !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "affiliate.payoutMethods" },
          update: { value: JSON.stringify(payoutMethods) },
          create: { key: "affiliate.payoutMethods", value: JSON.stringify(payoutMethods) }
        })
      )
    }

    await Promise.all(updates)

    console.log(`Admin ${session.user.id} updated affiliate settings:`, {
      enabled,
      commissionRate,
      minPayout,
      payoutMethods
    })

    return NextResponse.json({
      message: "Affiliate settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating affiliate settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}