import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { z } from "zod"

// Schema for payment update validation
const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "REJECTED"]),
  paidAt: z.string().datetime().nullable().optional(),
  transactionId: z.string().nullable().optional(),
})

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

    const paymentId = params.id
    const body = await request.json()
    
    const validatedData = updatePaymentSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.format() },
        { status: 400 }
      )
    }

    // Get the payment first to check if it exists
    const payment = await prisma.affiliatePayment.findUnique({
      where: { id: paymentId },
      include: { affiliate: true }
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment status and other fields
    const updatedPayment = await prisma.affiliatePayment.update({
      where: { id: paymentId },
      data: {
        status: validatedData.data.status,
        paidAt: validatedData.data.status === "PAID" ? 
          (validatedData.data.paidAt ? new Date(validatedData.data.paidAt) : new Date()) : 
          null,
        transactionId: validatedData.data.status === "PAID" ? 
          validatedData.data.transactionId : null,
      },
    })

    // If payment is being approved, update affiliate earnings
    if (validatedData.data.status === "PAID" && payment.status !== "PAID") {
      await prisma.affiliate.update({
        where: { id: payment.affiliateId },
        data: {
          pendingEarnings: {
            decrement: payment.amount
          },
          paidEarnings: {
            increment: payment.amount
          }
        }
      })
    }

    // If payment is being rejected after being paid, revert the earnings changes
    if (validatedData.data.status === "REJECTED" && payment.status === "PAID") {
      await prisma.affiliate.update({
        where: { id: payment.affiliateId },
        data: {
          pendingEarnings: {
            increment: payment.amount
          },
          paidEarnings: {
            decrement: payment.amount
          }
        }
      })
    }

    return NextResponse.json({
      message: `Payment ${validatedData.data.status.toLowerCase()} successfully`,
      payment: updatedPayment
    })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    )
  }
}