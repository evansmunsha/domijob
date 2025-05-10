import { prisma } from "@/app/utils/db"
import { notFound } from "next/navigation"
import CompanyProfileClient from "./CompanyProfileClient"

type Props = {
  params: { id: string }
}

export const dynamic = "force-static"; // Ensure Next.js pre-renders this page

export async function generateStaticParams() {
  const companies = await prisma.company.findMany({
    select: { id: true },
    take: 100, // Limit to avoid long builds in dev/preview
  });

  return companies.map((company) => ({
    id: company.id,
  }));
}

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
  });

  if (!company) notFound();

  return {
    ...company,
    foundedYear: company.foundedYear ? Number(company.foundedYear) : null,
  };
}

export default async function CompanyProfilePage({ params }: Props) {
  const company = await getCompany(params.id);
  return <CompanyProfileClient company={company} />;
}
