"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationItem } from "@/components/company/NotificationItem"
import { NotificationActions } from "@/components/company/NotificationActions"
import { Bell } from "lucide-react"

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: Date
}

interface NotificationListProps {
  initialNotifications: Notification[]
  companyId: string
}

export function NotificationList({ initialNotifications, companyId }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ))
    
    // Use companyId in API call
    fetch(`/api/company/${companyId}/notifications/${id}/mark-read`, {
      method: 'POST',
    }).catch(error => console.error('Error marking notification as read:', error))
  }

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })))
    
    // Use companyId in API call
    fetch(`/api/company/${companyId}/notifications/mark-all-read`, {
      method: 'POST',
    }).catch(error => console.error('Error marking all notifications as read:', error))
  }

  const handleClearAll = () => {
    setNotifications([])
    
    // Use companyId in API call
    fetch(`/api/company/${companyId}/notifications/clear-all`, {
      method: 'DELETE',
    }).catch(error => console.error('Error clearing notifications:', error))
  }

  return (
    <div className="grid grid-cols-1 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Notifications</h1>
        <div className="flex justify-end">
          <NotificationActions 
            onMarkAllRead={handleMarkAllRead}
            onClearAll={handleClearAll}
          />
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-4 md:p-6 text-center">
              <Bell className="h-8 w-8 md:h-12 md:w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2 md:mb-4" />
              <p className="text-xs md:text-sm text-muted-foreground">No notifications yet.</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">We&apos;ll notify you when there&apos;s something new.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 