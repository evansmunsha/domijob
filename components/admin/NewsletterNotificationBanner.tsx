"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle2, X } from "lucide-react"

interface NewsletterNotificationBannerProps {
  postTitle?: string
  subscriberCount?: number
  onDismiss?: () => void
}

export function NewsletterNotificationBanner({
  postTitle,
  subscriberCount = 0,
  onDismiss,
}: NewsletterNotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200">Newsletter Sent Successfully! 🎉</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                {postTitle && `"${postTitle}" has been sent to `}
                <span className="font-medium">{subscriberCount} subscribers</span>
                {postTitle && " with AI tool promotions included"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
              <Mail className="h-3 w-3 mr-1" />
              Newsletter
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
