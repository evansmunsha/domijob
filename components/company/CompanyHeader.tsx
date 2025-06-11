"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart, Users } from "lucide-react"
import { NotificationCenter } from "@/components/general/NotificationCenter"

export function CompanyHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/company/dashboard" className="font-semibold">
            Company Dashboard
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/company/jobs" className="text-sm font-medium">
              Jobs
            </Link>
            <Link href="/company/applications" className="text-sm font-medium">
              Applications
            </Link>
            <Link href="/company/analytics" className="text-sm font-medium flex items-center">
              <BarChart className="h-4 w-4 mr-1" />
              Analytics
            </Link>
            <Link href="/company/potential-candidates" className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Potential Candidates
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter />
          <Button variant="outline" size="sm" asChild>
            <Link href="/company/profile">Company Profile</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

