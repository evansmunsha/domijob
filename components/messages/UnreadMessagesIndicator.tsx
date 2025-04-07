"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

export function UnreadMessagesIndicator() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const response = await fetch("/api/messages/unread-count")
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.count)
        }
      } catch (error) {
        console.error("Error fetching unread message count:", error)
      }
    }

    fetchUnreadCount()

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(intervalId)
  }, [])

  if (unreadCount === 0) return null

  return (
    <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
      {unreadCount}
    </Badge>
  )
}

