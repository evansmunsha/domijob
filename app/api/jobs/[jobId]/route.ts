import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"

export async function GET(request: Request, context: { params: { jobId: string } }) {
  try {
    const { jobId } = context.params
    console.log(request)

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
