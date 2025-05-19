import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { z } from "zod"

// Schema for payment status update
const paymentUpdateSchema = z.object({
  paymentId: z.string(),
  status: z.enum(["PENDING", "PROCESSING", "PAID", "REJECTED"]),
  transactionId: z.string().optional(),
  note: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    })

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const limit = parseInt(searchParams.get("limit") || "100", 10)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const skip = (page - 1) * limit

    // Build the where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.affiliatePayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              }
            }
          }
        }
      }),
      prisma.affiliatePayment.count({ where })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages
    
    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore
      }
    })
  } catch (error) {
    console.error("Error getting affiliate payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    })

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Validate request body
    const body = await request.json()
    const validationResult = paymentUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error },
        { status: 400 }
      )
    }

    const { paymentId, status, transactionId, note } = validationResult.data

    // Find the payment
    const payment = await prisma.affiliatePayment.findUnique({
      where: { id: paymentId },
      include: { affiliate: true }
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    // Update payment data based on status
    const updateData: any = { 
      status,
      updatedAt: new Date()
    }

    // If status is PAID, update paidAt and transactionId
    if (status === "PAID") {
      updateData.paidAt = new Date()
      if (transactionId) {
        updateData.transactionId = transactionId
      }
    }

    // Update payment in database
    const updatedPayment = await prisma.affiliatePayment.update({
      where: { id: paymentId },
      data: updateData
    })

    // If payment is PAID, update affiliate's paidEarnings
    if (status === "PAID") {
      await prisma.affiliate.update({
        where: { id: payment.affiliateId },
        data: {
          paidEarnings: { increment: payment.amount }
        }
      })
    }

    // If payment is REJECTED, return amount to pending earnings
    if (status === "REJECTED") {
      await prisma.affiliate.update({
        where: { id: payment.affiliateId },
        data: {
          pendingEarnings: { increment: payment.amount }
        }
      })
    }

    // Log the payment status change
    console.log(`Admin ${session.user.id} updated payment ${paymentId} status to ${status}`)

    // Construct the response
    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${status}`,
      payment: updatedPayment
    })
  } catch (error) {
    console.error("Error updating affiliate payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 