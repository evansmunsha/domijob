"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, Briefcase, Settings, DollarSign, Building, BarChartHorizontal, TrendingUp, BookOpen, MessageSquare, Sparkles } from 'lucide-react'

const navSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: Home },
      { name: "Growth", href: "/admin/growth", icon: TrendingUp },
    ]
  },
  {
    title: "Content",
    items: [
      { name: "Blog", href: "/admin/blog", icon: BookOpen },
      { name: "AI Assistant", href: "/admin/blog/ai-assistant", icon: Sparkles, special: true },
      { name: "Comments", href: "/admin/comments", icon: MessageSquare },
    ]
  },
  {
    title: "Management",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Companies", href: "/admin/companies", icon: Building },
      { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
    ]
  },
  {
    title: "Business",
    items: [
      { name: "Affiliate", href: "/admin/affiliate", icon: BarChartHorizontal },
      { name: "Payments", href: "/admin/affiliate/payments", icon: DollarSign },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  
  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>
      <nav className="mt-6">
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const Icon = item.icon
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-6 py-2 text-sm font-medium",
                          isActive
                            ? "bg-gray-100 text-primary dark:bg-gray-700 dark:text-white"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                        )}
                      >
                        <Icon className={cn(
                          "mr-3 h-4 w-4",
                          item.special && "text-purple-500"
                        )} />
                        {item.name}
                        {item.special && (
                          <span className="ml-auto">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              AI
                            </span>
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}