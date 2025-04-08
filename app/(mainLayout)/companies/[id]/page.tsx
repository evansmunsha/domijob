import { prisma } from "@/app/utils/db"
import { notFound } from "next/navigation"
import CompanyProfileClient from "./CompanyProfileClient"
import { use } from "react"

async function getCompany(id: string) {
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

  if (!company) notFound()
  
  // Convert foundedYear from string to number if it exists
  return {
    ...company,
    foundedYear: company.foundedYear ? Number(company.foundedYear) : null
  }
}

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const company = use(getCompany(resolvedParams.id))
  
  return <CompanyProfileClient company={company} />
}

