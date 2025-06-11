import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request) {
  try {
    // Manually extract jobId from the URL
    const url = new URL(request.url)
    const segments = url.pathname.split("/")
    const jobId = segments[segments.indexOf("jobs") + 1]

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is missing" }, { status: 400 })
    }

    // Fetch the job with company details
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            about: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Increment the applications counter (used as view count)
    await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        applications: { increment: 1 },
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}
