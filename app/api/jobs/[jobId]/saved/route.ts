import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract jobId from the URL
    const url = new URL(request.url)
    const segments = url.pathname.split("/")
    const jobId = segments[segments.indexOf("jobs") + 1]

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
    }

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
