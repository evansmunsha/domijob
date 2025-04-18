import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw, Download } from "lucide-react"

export const metadata: Metadata = {
  title: "User Management",
  description: "Admin panel for managing users",
}

export const revalidate = 0

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const session = await auth()
  
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }

  const search = searchParams.q || ""
  
  // Fetch users with search filter
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      userType: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Convert dates to strings and map userType to role for the table
  const formattedUsers = users.map(user => ({
    id: user.id,
    name: user.name || "",
    email: user.email,
    image: user.image || "",
    role: user.userType || "JOB_SEEKER",
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  }))

  const totalUsers = users.length
  const adminUsers = users.filter((user) => user.userType === "ADMIN").length
  const companyUsers = users.filter((user) => user.userType === "COMPANY").length
  const jobSeekerUsers = users.filter((user) => user.userType === "JOB_SEEKER").length

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">User Management</h1>
      
      <div className="flex items-center justify-between space-x-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <form>
              <Input
                type="search"
                placeholder="Search users..."
                name="q"
                defaultValue={search}
                className="w-full pl-8"
              />
            </form>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="h-9">Add User</Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <DataTable columns={columns} data={formattedUsers} />
      </div>
    </div>
  )
} 