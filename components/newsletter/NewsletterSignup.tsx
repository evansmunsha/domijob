//components/newsletter/NewsletterSignup.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Mail,
  CheckCircle2,
  Loader2,
  TrendingUp,
  BookOpen,
  Search,
  User,
  Sparkles
} from "lucide-react"

interface NewsletterSignupProps {
  variant?: "default" | "compact" | "sidebar"
  source?: string
}

export function NewsletterSignup({ variant = "default", source = "website" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [preferences, setPreferences] = useState({
    jobAlerts: true,
    careerTips: true,
    weeklyDigest: true,
    productUpdates: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    console.log("Subscribing email:", email)

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source,
          preferences,
          tags: ["blog_signup"]
        }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        setIsSubscribed(true)
        toast.success("🎉 Successfully subscribed to newsletter!")
        setEmail("") // Clear the email field
      } else {
        console.error("Subscription error:", data)
        toast.error(data.error || "Failed to subscribe. Please try again.")
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error)
      toast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-200">
            Welcome to DomiJob Newsletter! 🎉
          </h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Check your email for a welcome message with exclusive career resources.
          </p>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            Subscription Confirmed
          </Badge>
        </CardContent>
      </Card>
    )
  }

  if (variant === "compact") {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background/50"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} size="sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-1" />
                  Subscribe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (variant === "sidebar") {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Stay Updated</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Get weekly career tips and job alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} className="w-full" size="sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Unsubscribe anytime
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <CardHeader className="text-center relative z-10">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl mb-2">Accelerate Your Career</CardTitle>
        <CardDescription className="text-lg">
          Join 10,000+ professionals getting weekly career insights, job search tips, and exclusive resources
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-background/50 backdrop-blur-sm h-12"
                disabled={isLoading}
                required
              />
              <Button type="submit" disabled={isLoading} size="lg" className="px-8">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preferences */}
          <div className="max-w-md mx-auto">
            <h4 className="font-medium mb-3 text-center">What would you like to receive?</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="jobAlerts"
                  checked={preferences.jobAlerts}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, jobAlerts: checked as boolean }))
                  }
                />
                <label htmlFor="jobAlerts" className="text-sm">Job Alerts</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="careerTips"
                  checked={preferences.careerTips}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, careerTips: checked as boolean }))
                  }
                />
                <label htmlFor="careerTips" className="text-sm">Career Tips</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weeklyDigest"
                  checked={preferences.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, weeklyDigest: checked as boolean }))
                  }
                />
                <label htmlFor="weeklyDigest" className="text-sm">Weekly Digest</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="productUpdates"
                  checked={preferences.productUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, productUpdates: checked as boolean }))
                  }
                />
                <label htmlFor="productUpdates" className="text-sm">Product Updates</label>
              </div>
            </div>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-sm">
          <div className="text-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Weekly Tips</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Career Guides</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Job Alerts</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Expert Advice</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
