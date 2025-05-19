import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
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

    // Get AI settings
    const [
      enabledSetting,
      modelSetting,
      maxTokensSetting,
      costLimitSetting
    ] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "ai.enabled" } }),
      prisma.setting.findUnique({ where: { key: "ai.model" } }),
      prisma.setting.findUnique({ where: { key: "ai.maxTokens" } }),
      prisma.setting.findUnique({ where: { key: "ai.monthlyCostLimit" } })
    ])

    // Get usage statistics
    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlyUsage = await prisma.aIUsageLog.aggregate({
      where: {
        createdAt: {
          gte: firstDay
        }
      },
      _sum: {
        cost: true,
        tokenCount: true
      }
    });

    return NextResponse.json({
      enabled: enabledSetting?.value === "true",
      model: modelSetting?.value || "gpt-4o-mini", // Default to gpt-4o-mini
      maxTokens: maxTokensSetting ? parseInt(maxTokensSetting.value) : 1000,
      monthlyCostLimit: costLimitSetting ? parseFloat(costLimitSetting.value) : 50,
      usage: {
        monthlyTokens: monthlyUsage._sum.tokenCount || 0,
        monthlyCost: monthlyUsage._sum.cost || 0
      }
    })
  } catch (error) {
    console.error("Error getting AI settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
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
    const { enabled, model, maxTokens, monthlyCostLimit } = data

    // Validate inputs
    if (maxTokens !== undefined && (maxTokens < 100 || maxTokens > 8000)) {
      return NextResponse.json(
        { error: "Max tokens must be between 100 and 8000" },
        { status: 400 }
      )
    }

    if (monthlyCostLimit !== undefined && monthlyCostLimit < 0) {
      return NextResponse.json(
        { error: "Monthly cost limit must be a positive number" },
        { status: 400 }
      )
    }

    // Update settings using upsert to ensure they exist
    const updates = []

    if (enabled !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "ai.enabled" },
          update: { value: enabled.toString() },
          create: { key: "ai.enabled", value: enabled.toString() }
        })
      )
    }

    if (model) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "ai.model" },
          update: { value: model },
          create: { key: "ai.model", value: model }
        })
      )
    }

    if (maxTokens !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "ai.maxTokens" },
          update: { value: maxTokens.toString() },
          create: { key: "ai.maxTokens", value: maxTokens.toString() }
        })
      )
    }

    if (monthlyCostLimit !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "ai.monthlyCostLimit" },
          update: { value: monthlyCostLimit.toString() },
          create: { key: "ai.monthlyCostLimit", value: monthlyCostLimit.toString() }
        })
      )
    }

    await Promise.all(updates)

    console.log(`Admin ${session.user.id} updated AI settings:`, {
      enabled,
      model,
      maxTokens,
      monthlyCostLimit
    })

    return NextResponse.json({
      message: "AI settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating AI settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}