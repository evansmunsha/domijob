"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Bug, TestTube, Database, Mail } from "lucide-react"
import Link from "next/link"

export default function NewsletterDebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testEmail, setTestEmail] = useState("test@example.com")
  const [testResults, setTestResults] = useState<any>(null)

  const runDebugCheck = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/newsletter/debug")
      const data = await response.json()

      if (response.ok) {
        setDebugInfo(data)
        toast.success("Debug check completed")
      } else {
        toast.error(data.error || "Debug check failed")
      }
    } catch (error) {
      console.error("Debug check error:", error)
      toast.error("Failed to run debug check")
    } finally {
      setIsLoading(false)
    }
  }

  const testSubscription = async () => {
    if (!testEmail) {
      toast.error("Please enter an email to test")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/newsletter/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResults(data)
        toast.success("Subscription test completed")
      } else {
        toast.error(data.error || "Subscription test failed")
      }
    } catch (error) {
      console.error("Subscription test error:", error)
      toast.error("Failed to test subscription")
    } finally {
      setIsLoading(false)
    }
  }

  const actualSubscriptionTest = async () => {
    if (!testEmail) {
      toast.error("Please enter an email to test")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          source: "admin-debug-test",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Actual subscription test successful!")
      } else {
        toast.error(`Subscription failed: ${data.error}`)
        console.error("Subscription error details:", data)
      }
    } catch (error) {
      console.error("Actual subscription test error:", error)
      toast.error("Failed to test actual subscription")
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
            <Bug className="h-8 w-8 text-red-500" />
            Newsletter Debug
          </h1>
          <p className="text-muted-foreground">Debug and test newsletter subscription functionality</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      {/* Debug Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              System Debug Check
            </CardTitle>
            <CardDescription>Check database connection and newsletter system status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runDebugCheck} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bug className="h-4 w-4 mr-2" />}
              Run Debug Check
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-green-500" />
              Subscription Test
            </CardTitle>
            <CardDescription>Test newsletter subscription process with a specific email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-email">Test Email</Label>
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                type="email"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testSubscription} disabled={isLoading} variant="outline" className="flex-1">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                Dry Run Test
              </Button>
              <Button onClick={actualSubscriptionTest} disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Actual Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Results */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Database Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Connection</div>
                    <div className="font-medium">{debugInfo.database.connection}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Subscriptions</div>
                    <div className="font-medium">{debugInfo.database.totalSubscriptions}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                    <div className="font-medium">{debugInfo.database.activeSubscriptions}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Environment</h4>
                <div className="flex gap-2">
                  <Badge variant={debugInfo.environment.hasEmailService ? "default" : "destructive"}>
                    Email Service: {debugInfo.environment.hasEmailService ? "✅" : "❌"}
                  </Badge>
                  <Badge variant={debugInfo.environment.hasNextPublicUrl ? "default" : "secondary"}>
                    Public URL: {debugInfo.environment.hasNextPublicUrl ? "✅" : "⚠️"}
                  </Badge>
                  <Badge variant="outline">Environment: {debugInfo.environment.nodeEnv}</Badge>
                </div>
              </div>

              {Array.isArray(debugInfo.recentSubscriptions) && debugInfo.recentSubscriptions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recent Subscriptions</h4>
                  <div className="space-y-2">
                    {debugInfo.recentSubscriptions.map((sub: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-medium">{sub.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(sub.createdAt).toLocaleDateString()} • {sub.source}
                          </div>
                        </div>
                        <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>{sub.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Test Results</CardTitle>
            <CardDescription>Testing email: {testResults.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(testResults.steps).map(([step, result]: [string, any]) => (
                <div key={step} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium capitalize">{step.replace(/([A-Z])/g, " $1")}</h5>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "✅ Success" : "❌ Failed"}
                    </Badge>
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">Error: {result.error}</div>
                  )}
                  {result.data && (
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
