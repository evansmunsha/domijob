import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { z } from "zod"

// Schema for payment settings validation
const paymentSettingsSchema = z.object({
  paymentMethod: z.enum(["paypal", "bank"]),
  paypalEmail: z.string().email().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  routingNumber: z.string().optional(),
  country: z.string().optional(),
  swiftCode: z.string().optional(),
})

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user ID from session
    const userId = session.user.id

    // Check if user has an affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 })
    }

    // Return affiliate payment settings from database
    return NextResponse.json({ 
      settings: {
        paymentMethod: affiliate.paymentMethod || "paypal",
        paypalEmail: affiliate.paypalEmail || "",
        bankName: affiliate.bankName || "",
        accountNumber: affiliate.accountNumber || "",
        accountName: affiliate.accountName || "",
        routingNumber: affiliate.routingNumber || "",
        country: affiliate.country || "",
        swiftCode: affiliate.swiftCode || ""
      } 
    })
  } catch (error) {
    console.error("Error fetching affiliate payment settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user ID from session
    const userId = session.user.id

    // Parse request body
    const body = await request.json()
    
    // Validate payment settings
    const validationResult = paymentSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid payment settings", details: validationResult.error },
        { status: 400 }
      )
    }
    
    const settings = validationResult.data

    // Check if user has an affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 })
    }

    // Update payment settings in database
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        paymentMethod: settings.paymentMethod,
        paypalEmail: settings.paypalEmail,
        bankName: settings.bankName,
        accountNumber: settings.accountNumber,
        accountName: settings.accountName,
        routingNumber: settings.routingNumber,
        country: settings.country,
        swiftCode: settings.swiftCode
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: "Payment settings updated successfully" 
    })
  } catch (error) {
    console.error("Error updating affiliate payment settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 