"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Users, FileText, Eye, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface NotificationSummaryProps {
  companyId: string
}

interface NotificationCount {
  total: number
  byType: {
    NEW_APPLICATION: number
    APPLICATION_STATUS_UPDATED: number
    PROFILE_VIEWS: number
    POTENTIAL_CANDIDATE: number
  }
}

export function NotificationSummary({ companyId }: NotificationSummaryProps) {
  const [counts, setCounts] = useState<NotificationCount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotificationCounts() {
      try {
        setLoading(true)
        console.log(`Fetching notification counts for company: ${companyId}`)

        // Check if companyId is valid before making the request
        if (!companyId) {
          console.error("Missing companyId for notification counts")
          return
        }

        const response = await fetch(`/api/company/notification-counts?companyId=${companyId}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Error response (${response.status}):`, errorText)
          throw new Error(`Failed to fetch notification counts: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Notification counts data:", data)
        setCounts(data)
      } catch (error) {
        console.error("Error fetching notification counts:", error)
        // Don't set error state, just log it to avoid breaking the UI
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchNotificationCounts()
      // Set up polling to check for new notifications
      const intervalId = setInterval(fetchNotificationCounts, 60000) // Check every minute

      return () => clearInterval(intervalId)
    }
  }, [companyId])

  if (loading) {
    return <NotificationSummarySkeleton />
  }

  if (!counts) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "NEW_APPLICATION":
        return <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
      case "APPLICATION_STATUS_UPDATED":
        return <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
      case "PROFILE_VIEWS":
        return <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
      case "POTENTIAL_CANDIDATE":
        return <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
      default:
        return <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
    }
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base md:text-lg flex items-center">
          <Bell className="mr-2 h-4 w-4 md:h-5 md:w-5" />
          Notification Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 gap-2">
          <div className="grid grid-cols-2 items-center">
            <span className="text-xs md:text-sm font-medium">Total Unread</span>
            <div className="flex justify-end">
              <Badge variant={counts.total > 0 ? "default" : "outline"} className="text-xs md:text-sm">{counts.total}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="grid grid-cols-2 items-center p-1.5 md:p-2 bg-muted/50 rounded-md">
              <div className="flex items-center">
                {getIcon("NEW_APPLICATION")}
                <span className="text-[10px] md:text-xs ml-1.5 md:ml-2">New Applications</span>
              </div>
              <div className="flex justify-end">
                <Badge variant="outline" className="text-[10px] md:text-xs">
                {counts.byType.NEW_APPLICATION}
              </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 items-center p-1.5 md:p-2 bg-muted/50 rounded-md">
              <div className="flex items-center">
                {getIcon("APPLICATION_STATUS_UPDATED")}
                <span className="text-[10px] md:text-xs ml-1.5 md:ml-2">Status Updates</span>
              </div>
              <div className="flex justify-end">
                <Badge variant="outline" className="text-[10px] md:text-xs">
                {counts.byType.APPLICATION_STATUS_UPDATED}
              </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 items-center p-1.5 md:p-2 bg-muted/50 rounded-md">
              <div className="flex items-center">
                {getIcon("PROFILE_VIEWS")}
                <span className="text-[10px] md:text-xs ml-1.5 md:ml-2">Profile Views</span>
              </div>
              <div className="flex justify-end">
                <Badge variant="outline" className="text-[10px] md:text-xs">
                {counts.byType.PROFILE_VIEWS}
              </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 items-center p-1.5 md:p-2 bg-muted/50 rounded-md">
              <div className="flex items-center">
                {getIcon("POTENTIAL_CANDIDATE")}
                <span className="text-[10px] md:text-xs ml-1.5 md:ml-2">Potential Matches</span>
              </div>
              <div className="flex justify-end">
                <Badge variant="outline" className="text-[10px] md:text-xs">
                {counts.byType.POTENTIAL_CANDIDATE}
              </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 pt-2">
            <Link href="/company/notifications" className="text-[10px] md:text-xs text-primary hover:underline">
              View all notifications
            </Link>
            <div className="flex justify-end">
              <Link href="/company/potential-candidates" className="text-[10px] md:text-xs text-primary hover:underline">
              View potential candidates
            </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationSummarySkeleton() {
  return (
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2">
        <Skeleton className="h-5 md:h-6 w-36 md:w-48" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 gap-2">
          <div className="grid grid-cols-2 items-center">
            <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
            <div className="flex justify-end">
              <Skeleton className="h-5 md:h-6 w-6 md:w-8" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 md:h-10 w-full" />
            ))}
          </div>

          <div className="grid grid-cols-2 pt-2">
            <Skeleton className="h-3 md:h-4 w-28 md:w-32" />
            <div className="flex justify-end">
              <Skeleton className="h-3 md:h-4 w-28 md:w-32" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

