import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the company ID from the URL
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const companyId = id
    const data = await request.json()

    // Verify the user owns this company
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found or you don't have permission to edit it" }, { status: 403 })
    }

    // Update the company profile
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        about: data.about,
        industry: data.industry,
        location: data.location,
        website: data.website,
        size: data.size,
        foundedYear: data.foundedYear,
        xAccount: data.xAccount,
        logo: data.logo,
      },
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error("Error updating company profile:", error)
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Extract the company ID from the URL
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
        logo: true,
        location: true,
        website: true,
        about: true,
        foundedYear: true,
        size: true,
        xAccount: true,
        industry: true,
        JobPost: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error("Error fetching company:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

