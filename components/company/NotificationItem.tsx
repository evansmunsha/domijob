"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

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
    <li className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className={`${isRead ? "text-muted-foreground" : "font-medium"}`}>
            {message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
        {!isRead && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleMarkAsRead}
            disabled={isLoading}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  )
} 