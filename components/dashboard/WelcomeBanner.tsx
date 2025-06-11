"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import confetti from "canvas-confetti"

interface WelcomeBannerProps {
  name: string
  userType: string | null
}

export function WelcomeBanner({ name, userType }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Trigger confetti effect when the component mounts
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  if (!visible) return null

  return (
    <Card className="bg-primary text-primary-foreground mb-8 relative overflow-hidden">
      <CardContent className="pt-6 pb-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-2">Welcome to domijob, {name}! 🎉</h2>
          <p className="mb-4">
            {userType === "JOB_SEEKER"
              ? "Your job seeker profile has been created successfully. Now you can start exploring job opportunities that match your skills and experience."
              : "Your profile has been created successfully. We're excited to have you on board!"}
          </p>

          <div className="flex flex-wrap gap-3">
            {userType === "JOB_SEEKER" && (
              <>
                <Button variant="secondary" asChild>
                  <a href="/jobs">Browse Jobs</a>
                </Button>
                <Button
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href="/profile">Complete Your Profile</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

