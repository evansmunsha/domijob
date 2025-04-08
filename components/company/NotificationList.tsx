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
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <NotificationActions 
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-muted-foreground">No notifications yet.</p>
              <p className="text-sm text-muted-foreground mt-2">We&apos;ll notify you when there&apos;s something new.</p>
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
    </>
  )
} 