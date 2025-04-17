import { ReactNode } from "react"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  
  // Check if user is authenticated and is an admin
  // Currently only COMPANY and JOB_SEEKER are defined in UserType enum
  // So we need to check if the user is authenticated and has admin privileges another way
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/login?callbackUrl=/admin")
  }
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}