import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 })
    }

    const application = await prisma.jobApplication.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    })

    if (!application) {
      return new NextResponse(null, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application details:", error)
    return new NextResponse(null, { status: 500 })
  }
}

