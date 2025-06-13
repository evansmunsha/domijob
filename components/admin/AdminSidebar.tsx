 "use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  Briefcase,
  Settings,
  DollarSign,
  Building,
  BarChartHorizontal,
  TrendingUp
} from "lucide-react"

const navItems = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Growth", href: "/admin/growth", icon: TrendingUp },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Companies", href: "/admin/companies", icon: Building },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Affiliate", href: "/admin/affiliate", icon: BarChartHorizontal },
  { name: "Payments", href: "/admin/affiliate/payments", icon: DollarSign },
  { name: "Settings", href: "/admin/settings", icon: Settings }
]

export function AdminSidebar() {
  const pathname = usePathname()
  
  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>
      <nav className="mt-6">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-6 py-3 text-sm font-medium",
                    isActive
                      ? "bg-gray-100 text-primary dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}