"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NotificationBadge } from "@/components/company/NotificationBadge"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

export default function CompanyLayout({ children }: Props) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar}
          className="bg-white dark:bg-gray-800"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar - hidden on mobile by default */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className=" border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Company Dashboard</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link 
            href="/company-dashboard" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/company-dashboard") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
          >
            <span className="ml-2">Company Profile</span>
          </Link>
          <Link 
            href="/company/notifications" 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              isActive("/company/notifications") 
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            
            <NotificationBadge />
          </Link>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            <span className="ml-2 text-gray-700 dark:text-gray-300">Settings</span>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center ">
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
        
        <main className="flex-1 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

