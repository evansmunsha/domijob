import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/app/utils/db"

interface Params {
  id: string
}

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
})

export async function GET(req: NextRequest, context: { params: Params }): Promise<NextResponse> {
  try {
    const { params } = routeContextSchema.parse(context)

    const { id } = params

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: { approved: true },
            },
            likes: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 })
  }
}
