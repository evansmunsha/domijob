import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get jobId from the URL manually
    const url = new URL(request.url)
    const segments = url.pathname.split("/")
    const jobId = segments[segments.indexOf("job") + 1] // gets the [jobId] segment

    if (!jobId) {
      return NextResponse.json({ error: "Job ID missing" }, { status: 400 })
    }

    // Check if the job exists
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if the user has applied
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
