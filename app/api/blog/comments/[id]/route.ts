import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(["approve", "reject"])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Check if user is admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { action } = actionSchema.parse(body)

    // Check if comment exists
    const comment = await prisma.blogComment.findUnique({
      where: { id },
      include: {
        replies: true
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Update comment and its replies
    if (action === "approve") {
      // When approving a parent comment, also approve all its replies
      const [updatedComment] = await prisma.$transaction([
        prisma.blogComment.update({
          where: { id },
          data: { approved: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }),
        // If this is a parent comment, approve all its replies
        ...(comment.parentId === null ? [
          prisma.blogComment.updateMany({
            where: { parentId: id },
            data: { approved: true }
          })
        ] : [])
      ])

      return NextResponse.json(updatedComment)
    } else {
      // When rejecting a parent comment, also reject all its replies
      const [updatedComment] = await prisma.$transaction([
        prisma.blogComment.update({
          where: { id },
          data: { approved: false },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }),
        // If this is a parent comment, reject all its replies
        ...(comment.parentId === null ? [
          prisma.blogComment.updateMany({
            where: { parentId: id },
            data: { approved: false }
          })
        ] : [])
      ])

      return NextResponse.json(updatedComment)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    )
  }
} 