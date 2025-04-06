"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"

interface Notification {
  id: string
  type: string
  message: string
  jobId?: string
  createdAt: Date
  read: boolean
  job?: {
    jobTitle: string
  }
}

// Add polling interval as a prop with a default value
export function NotificationCenter({ pollingInterval = 60000 }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/notifications")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.error || "Failed to fetch notifications")
      }

      const data = await response.json()
      console.log("Fetched notifications:", data)
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Set up polling to check for new notifications
    const intervalId = setInterval(fetchNotifications, pollingInterval)

    return () => clearInterval(intervalId)
  }, [pollingInterval])

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to mark notification as read")

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to mark all notifications as read")

      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b last:border-b-0 ${!notification.read ? "bg-muted/50" : ""}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <Badge variant="outline" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {notification.jobId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      asChild
                      onClick={() => {
                        markAsRead(notification.id)
                        setOpen(false)
                      }}
                    >
                      <Link href={`/job/${notification.jobId}`}>View Job</Link>
                    </Button>
                  )}
                  {notification.type === "SKILL_GAP_ANALYSIS" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      asChild
                      onClick={() => {
                        markAsRead(notification.id)
                        setOpen(false)
                      }}
                    >
                      <Link href="/profile?tab=skills">View Skills</Link>
                    </Button>
                  )}
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={fetchNotifications}>
            Refresh
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

