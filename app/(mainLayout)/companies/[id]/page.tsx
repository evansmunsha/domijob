
import { prisma } from "@/app/utils/db"
import { notFound } from "next/navigation"
import CompanyProfileClient from "./CompanyProfileClient"

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
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

    return <CompanyProfileClient company={{ ...company, foundedYear: company.foundedYear ? Number(company.foundedYear) : null }} />

}
