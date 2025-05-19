import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { z } from "zod"

const updateAffiliateSchema = z.object({
  code: z.string().min(3).max(20).optional(),
  commissionRate: z.number().min(0.01).max(1).optional(),
  paymentMethod: z.string().min(1).optional(),
  paypalEmail: z.string().email().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  routingNumber: z.string().optional().nullable(),
  swiftCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        AffiliatePayment: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    return NextResponse.json(affiliate)
  } catch (error) {
    console.error("Error fetching affiliate:", error)
    return NextResponse.json(
      { error: "Failed to fetch affiliate" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    const validatedData = updateAffiliateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.format() },
        { status: 400 }
      )
    }

    // Check if code is already taken by another affiliate
    if (validatedData.data.code) {
      const existingAffiliate = await prisma.affiliate.findFirst({
        where: {
          code: validatedData.data.code,
          id: { not: params.id },
        },
      })

      if (existingAffiliate) {
        return NextResponse.json(
          { error: "Affiliate code already in use" },
          { status: 400 }
        )
      }
    }

    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: params.id },
      data: {
        ...(validatedData.data.code && { code: validatedData.data.code }),
        ...(validatedData.data.commissionRate && { 
          commissionRate: validatedData.data.commissionRate 
        }),
        ...(validatedData.data.paymentMethod && { 
          paymentMethod: validatedData.data.paymentMethod 
        }),
        ...(validatedData.data.paypalEmail !== undefined && {
          paypalEmail: validatedData.data.paypalEmail
        }),
        ...(validatedData.data.bankName !== undefined && {
          bankName: validatedData.data.bankName
        }),
        ...(validatedData.data.accountNumber !== undefined && {
          accountNumber: validatedData.data.accountNumber
        }),
        ...(validatedData.data.accountName !== undefined && {
          accountName: validatedData.data.accountName
        }),
        ...(validatedData.data.routingNumber !== undefined && {
          routingNumber: validatedData.data.routingNumber
        }),
        ...(validatedData.data.swiftCode !== undefined && {
          swiftCode: validatedData.data.swiftCode
        }),
        ...(validatedData.data.country !== undefined && {
          country: validatedData.data.country
        }),
      },
    })

    return NextResponse.json(updatedAffiliate)
  } catch (error) {
    console.error("Error updating affiliate:", error)
    return NextResponse.json(
      { error: "Failed to update affiliate" },
      { status: 500 }
    )
  }
} 