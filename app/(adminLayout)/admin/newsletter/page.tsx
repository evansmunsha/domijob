"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Mail, Users, TrendingUp, Send, Eye, Settings } from "lucide-react"
import Link from "next/link"

export default function NewsletterManagementPage() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/newsletter/subscribe")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching newsletter stats:", error)
      toast.error("Failed to load newsletter statistics")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            Newsletter Management
          </h1>
          <p className="text-muted-foreground">Manage subscribers and newsletter campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/newsletter/debug">
              <Settings className="h-4 w-4 mr-2" />
              Debug Tools
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/blog">
              <Send className="h-4 w-4 mr-2" />
              Create Blog Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">New subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">Last campaign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscribers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscribers</CardTitle>
          <CardDescription>Latest newsletter subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.subscriptions?.slice(0, 10).map((subscriber: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <div className="font-medium">{subscriber.email}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(subscriber.createdAt).toLocaleDateString()} • {subscriber.source}
                </div>
              </div>
              <Badge variant={subscriber.status === "ACTIVE" ? "default" : "secondary"}>{subscriber.status}</Badge>
            </div>
          )) || <div className="text-center py-8 text-muted-foreground">No subscribers yet</div>}
        </CardContent>
      </Card>

      {/* Newsletter Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Automatic Notifications</CardTitle>
            <CardDescription>Subscribers get notified when you publish new blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  ✓ Active
                </Badge>
                <span className="text-sm">New blog post notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  ✓ Active
                </Badge>
                <span className="text-sm">AI tool promotions included</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  ✓ Active
                </Badge>
                <span className="text-sm">Welcome email automation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Tool Integration</CardTitle>
            <CardDescription>Blog posts automatically promote relevant AI tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">• Resume Enhancer promotions</div>
              <div className="text-sm">• Job Matching suggestions</div>
              <div className="text-sm">• Interview Prep recommendations</div>
              <div className="text-sm">• Salary Negotiator mentions</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
