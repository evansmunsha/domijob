import { prisma } from "@/app/utils/db"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default async function CompaniesPage() {
  // Fetch all companies
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          JobPost: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Companies</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="overflow-hidden">
            <div className="h-32 bg-muted flex items-center justify-center">
              <Image
                src={company.logo || `https://avatar.vercel.sh/${company.name}`}
                alt={company.name}
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">{company.name}</h2>
              <p className="text-muted-foreground line-clamp-3 mb-4">
                {company.about || "No company description available."}
              </p>
              <div className="text-sm text-muted-foreground">{company._count.JobPost} open positions</div>
            </CardContent>
            <CardFooter className="bg-muted/20 px-6 py-3">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/companies/${company.id}`}>View Company</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {companies.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No companies found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

