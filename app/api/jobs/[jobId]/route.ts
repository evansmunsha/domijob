import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    // Await the params object before accessing jobId
    const { jobId } = await context.params

    const job = await prisma.jobPost.findUnique({
      where: {
        id: jobId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        jobTitle: true,
        jobDescription: true,
        location: true,
        employmentType: true,
        benefits: true,
        createdAt: true,
        listingDuration: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
            about: true,
          },
        },
      },
    })

    if (!job) {
      return new NextResponse(null, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error("Error fetching job:", error)
    return new NextResponse(null, { status: 500 })
  }
}

