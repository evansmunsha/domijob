import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request, context: { params: { jobId: string } }) {
  try {
    const session = await auth()
console.log(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = context.params

    // Check if the job exists
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if the job is saved by the user
    const savedJob = await prisma.savedJobPost.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    })

    if (!savedJob) {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(savedJob)
  } catch (error) {
    console.error("Error checking saved job status:", error)
    return NextResponse.json({ error: "Failed to check saved job status" }, { status: 500 })
  }
}
