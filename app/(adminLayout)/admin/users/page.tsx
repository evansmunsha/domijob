import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Users | Admin Dashboard",
  description: "Manage users in the system",
}

export default async function UsersPage() {
  const session = await auth()
  
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      userType: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
      </div>
      <div className="mt-8">
        <DataTable columns={columns} data={users} />
      </div>
    </div>
  )
} 