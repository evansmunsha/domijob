import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { columns, Company } from "./columns"
import { DataTable } from "./data-table"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Companies | Admin Dashboard",
  description: "Manage companies in the system",
}

export default async function CompaniesPage() {
  const session = await auth()
  
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }

  // Fetch companies with related job count
  const dbCompanies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      website: true,
      location: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          email: true
        }
      },
      _count: {
        select: {
          JobPost: {
            where: {
              status: "ACTIVE"
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Transform data to match expected Company type
  const companies: Company[] = dbCompanies.map(company => ({
    id: company.id,
    name: company.name,
    email: company.user.email,
    website: company.website,
    status: "ACTIVE", // Default status
    verified: false, // Default since not in schema
    jobCount: company._count.JobPost,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage company profiles and verify business accounts
          </p>
        </div>
        <Link href="/admin/companies/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>
      
      <div className="rounded-md border">
        <DataTable columns={columns} data={companies} />
      </div>
    </div>
  )
}