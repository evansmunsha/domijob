"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

export function UnreadMessagesIndicator() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchUnreadCount() {
      // Don't fetch if we're already loading or component is unmounted
      if (loading || !isMounted) return

      try {
        setLoading(true)
        const response = await fetch("/api/messages/unread-count")
        if (response.ok && isMounted) {
          const data = await response.json()
          setUnreadCount(data.count)
        }
      } catch (error) {
        console.error("Error fetching unread message count:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUnreadCount()

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchUnreadCount, 30000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [loading])

  if (unreadCount === 0) return null

  return (
    <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
      {unreadCount}
    </Badge>
  )
}
