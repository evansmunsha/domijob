"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  id: string
  message: string
  read: boolean
  createdAt: Date
  onMarkAsRead: (id: string) => void
}

export function NotificationItem({ id, message, read, createdAt, onMarkAsRead }: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRead, setIsRead] = useState(read)

  const handleMarkAsRead = async () => {
    if (isRead) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/company/notifications/${id}/mark-read`, {
        method: 'POST',
      })
      
      if (response.ok) {
        setIsRead(true)
        onMarkAsRead(id)
        toast.success("Notification marked as read")
      } else {
        toast.error("Failed to mark notification as read")
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <li className={cn(
      "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
      !read && "bg-blue-50 dark:bg-blue-900/10"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className={cn(
            "text-sm",
            !read && "font-medium"
          )}>
            {message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!read && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMarkAsRead}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  )
} 