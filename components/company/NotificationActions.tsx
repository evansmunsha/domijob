"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface NotificationActionsProps {
  onMarkAllRead: () => void
  onClearAll: () => void
}

export function NotificationActions({ onMarkAllRead, onClearAll }: NotificationActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkAllRead = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/company/notifications/mark-all-read', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast.success("All notifications marked as read")
        onMarkAllRead()
      } else {
        toast.error("Failed to mark notifications as read")
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications? This action cannot be undone.")) {
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/company/notifications/clear-all', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast.success("All notifications cleared")
        onClearAll()
      } else {
        toast.error("Failed to clear notifications")
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={handleMarkAllRead}
        disabled={isLoading}
      >
        <Check className="h-4 w-4" />
        Mark all as read
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleClearAll}
        disabled={isLoading}
      >
        <Trash2 className="h-4 w-4" />
        Clear all
      </Button>
    </div>
  )
} 