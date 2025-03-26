import type { ReactNode } from "react"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import Link from "next/link"

interface CompanyLayoutProps {
  children: ReactNode
}

export default async function CompanyLayout({ children }: CompanyLayoutProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.userType !== "COMPANY") {
    redirect("/dashboard")
  }

  // Get the company
  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  })

  if (!company) {
    redirect("/onboarding")
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-muted/30 border-r p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-6">Company Portal</h2>

        <nav className="space-y-1 mb-6">
          <a href="/company-dashboard" className="block p-2 rounded hover:bg-muted">
            Dashboard
          </a>
          <a href="/my-jobs" className="block p-2 rounded hover:bg-muted">
            My Jobs
          </a>
          <a href="/applications" className="block p-2 rounded hover:bg-muted">
            Applications
          </a>
          <a href="/company/analytics" className="block p-2 rounded hover:bg-muted">
            Analytics
          </a>
          <a href="/company/potential-candidates" className="block p-2 rounded hover:bg-muted">
            Potential Candidates
          </a>
          <a href="/company-profile" className="block p-2 rounded hover:bg-muted">
            Company Profile
          </a>
          <a href="/company/notifications" className="block p-2 rounded hover:bg-muted">
            View notifications
          </a>
        </nav>

        
      </div>

        
      {/* Main content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}

