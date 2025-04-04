import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
import { NextResponse } from "next/server"

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 })
    }

    // Await the params object before accessing jobId
    const { jobId } = await context.params

    const savedJob = await prisma.savedJobPost.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: jobId,
        },
      },
      select: {
        id: true,
      },
    })

    if (!savedJob) {
      return new NextResponse(null, { status: 404 })
    }

    return NextResponse.json(savedJob)
  } catch (error) {
    console.error("Error checking saved job:", error)
    return new NextResponse(null, { status: 500 })
  }
}

