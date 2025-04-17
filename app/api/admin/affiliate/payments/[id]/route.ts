import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { z } from "zod"

// Schema for payment update validation
const paymentUpdateSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "PAID", "REJECTED"]),
  transactionId: z.string().optional(),
  paidAt: z.string().datetime().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params promise
    const resolvedParams = await params
    const paymentId = resolvedParams.id

    // Check if user is authenticated and is admin
    const session = await auth()
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    
    // Validate payment update
    const validationResult = paymentUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid payment update", details: validationResult.error },
        { status: 400 }
      )
    }
    
    const update = validationResult.data

    // Check if payment exists
    const payment = await prisma.affiliatePayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment
    const updatedPayment = await prisma.affiliatePayment.update({
      where: { id: paymentId },
      data: {
        status: update.status,
        ...(update.transactionId && { transactionId: update.transactionId }),
        ...(update.paidAt && { paidAt: new Date(update.paidAt) }),
      },
    })

    // If payment is marked as paid, update affiliate's paid earnings
    if (update.status === "PAID" && payment.status !== "PAID") {
      await prisma.affiliate.update({
        where: { id: payment.affiliateId },
        data: {
          paidEarnings: {
            increment: payment.amount,
          },
        },
      })

      // TODO: Send notification to affiliate about payment completion
    }

    // If payment is rejected, return the amount to pending earnings
    if (update.status === "REJECTED" && payment.status !== "REJECTED") {
      await prisma.affiliate.update({
        where: { id: payment.affiliateId },
        data: {
          pendingEarnings: {
            increment: payment.amount,
          },
        },
      })

      // TODO: Send notification to affiliate about payment rejection
    }

    return NextResponse.json({
      message: "Payment updated successfully",
      payment: updatedPayment,
    })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}