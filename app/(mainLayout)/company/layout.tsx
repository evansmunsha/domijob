import type { ReactNode } from "react"
import Link from "next/link"

interface Props {
  children: ReactNode
}

export default function CompanyLayout({ children }: Props) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-semibold">Company Dashboard</h1>
        </div>
        <nav className="space-y-1 mb-6">
          <Link href="/company-dashboard" className="block p-2 rounded hover:bg-muted">
            Dashboard
          </Link>
          <Link href="/my-jobs" className="block p-2 rounded hover:bg-muted">
            Manage listings
          </Link>
          <Link href="/applications" className="block p-2 rounded hover:bg-muted">
            Applications
          </Link>
          <Link href="/company/analytics" className="block p-2 rounded hover:bg-muted">
            Analytics
          </Link>
          <Link href="/company/potential-candidates" className="block p-2 rounded hover:bg-muted">
            Potential Candidates
          </Link>
          <Link href="/company-profile" className="block p-2 rounded hover:bg-muted">
            Company Profile
          </Link>
          <Link href="/company/notifications" className="block p-2 rounded hover:bg-muted">
            View notifications
          </Link>
        </nav>
        
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">{children}</div>
    </div>
  )
}

