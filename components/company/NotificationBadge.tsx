"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  
  const isActive = pathname === "/company/notifications" || pathname?.startsWith("/company/notifications/")
  
  useEffect(() => {
    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/company/notifications/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.count)
        }
      } catch (error) {
        console.error('Failed to fetch notification count:', error)
      }
    }
    
    fetchUnreadCount()
    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <Link 
      href="/company/notifications" 
      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        isActive 
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
    >
      <div className="flex items-center">
        <Bell className="h-5 w-5 mr-2" />
        <span>Notifications</span>
      </div>
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {unreadCount}
        </span>
      )}
    </Link>
  )
} 