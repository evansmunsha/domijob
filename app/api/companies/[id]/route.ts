import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = params.id
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

