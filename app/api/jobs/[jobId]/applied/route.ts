import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 })
    }
console.log(request)
    // Await the params object before accessing jobId
    const { jobId } = await params

    const application = await prisma.jobApplication.findUnique({
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

    if (!application) {
      return new NextResponse(null, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error checking job application:", error)
    return new NextResponse(null, { status: 500 })
  }
}

