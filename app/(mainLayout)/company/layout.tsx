"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NotificationBadge } from "@/components/company/NotificationBadge"

interface Props {
  children: ReactNode
}

export default function CompanyLayout({ children }: Props) {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Company Dashboard</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            href="/company-dashboard" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/company-dashboard") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="ml-2">Dashboard</span>
          </Link>
          <Link 
            href="/my-jobs" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/my-jobs") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="ml-2">Manage listings</span>
          </Link>
          <Link 
            href="/applications" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/applications") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="ml-2">Applications</span>
          </Link>
          <Link 
            href="/company/analytics" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/company/analytics") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="ml-2">Analytics</span>
          </Link>
          <Link 
            href="/company/potential-candidates" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/company/potential-candidates") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="ml-2">Potential Candidates</span>
          </Link>
          <Link 
            href="/company-profile" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/company-profile") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="ml-2">Company Profile</span>
          </Link>
          <NotificationBadge />
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            <span className="ml-2 text-gray-700 dark:text-gray-300">Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center px-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {pathname === "/company-dashboard" ? "Dashboard" : 
             pathname === "/my-jobs" ? "Manage Listings" :
             pathname === "/applications" ? "Applications" :
             pathname === "/company/analytics" ? "Analytics" :
             pathname === "/company/potential-candidates" ? "Potential Candidates" :
             pathname === "/company-profile" ? "Company Profile" :
             pathname === "/company/notifications" ? "Notifications" : "Dashboard"}
          </h2>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

