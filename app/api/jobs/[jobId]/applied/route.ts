import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(_request: Request, { params }: { params: { jobId: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = params

    // Check if the job exists
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if the user has applied for this job
    const application = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    })

    if (!application) {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error checking application status:", error)
    return NextResponse.json({ error: "Failed to check application status" }, { status: 500 })
  }
}
