"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { NotificationSummary } from "@/components/company/NotificationSummary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestNotificationsPage() {
  const [companyId, setCompanyId] = useState("")
  const [loading, setLoading] = useState(false)
  const [notificationType, setNotificationType] = useState("NEW_APPLICATION")
  const [message, setMessage] = useState("")
  const [jobId, setJobId] = useState("")
  const [viewCount, setViewCount] = useState(1)
  const [location, setLocation] = useState("United States")
  const [applicantName, setApplicantName] = useState("Test Applicant")
  const [activeTab, setActiveTab] = useState("notifications")
  const [error, setError] = useState<string | null>(null)

  const createNotification = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!companyId) {
        toast.error("Company ID is required")
        return
      }

      const response = await fetch("/api/test/create-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: notificationType,
          message: message || `Test ${notificationType} notification`,
          jobId: jobId || undefined,
          metadata:
            notificationType === "POTENTIAL_CANDIDATE"
              ? {
                  skills: ["JavaScript", "React", "TypeScript"],
                  matchScore: 85,
                  viewerName: "Test Candidate",
                }
              : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create notification")
      }

      const data = await response.json()
      toast.success("Test notification created successfully")
      console.log("Created notification:", data)
    } catch (error) {
      console.error("Error creating notification:", error)
      setError(error instanceof Error ? error.message : "Failed to create test notification")
      toast.error("Failed to create test notification")
    } finally {
      setLoading(false)
    }
  }

  const simulateProfileViews = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!companyId) {
        toast.error("Company ID is required")
        return
      }

      const response = await fetch("/api/test/simulate-profile-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          location,
          count: viewCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to simulate profile views")
      }

      const data = await response.json()
      toast.success(`${viewCount} profile view(s) simulated successfully`)
      console.log("Simulated profile views:", data)
    } catch (error) {
      console.error("Error simulating profile views:", error)
      setError(error instanceof Error ? error.message : "Failed to simulate profile views")
      toast.error("Failed to simulate profile views")
    } finally {
      setLoading(false)
    }
  }

  const simulateApplication = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!companyId) {
        toast.error("Company ID is required")
        return
      }

      const response = await fetch("/api/test/simulate-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          jobId: jobId || undefined,
          applicantName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to simulate application")
      }

      const data = await response.json()
      toast.success("Test application notification created successfully")
      console.log("Simulated application:", data)
    } catch (error) {
      console.error("Error simulating application:", error)
      setError(error instanceof Error ? error.message : "Failed to simulate application")
      toast.error("Failed to simulate application")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Test Notification System</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="notifications">Create Notifications</TabsTrigger>
          <TabsTrigger value="profile-views">Simulate Profile Views</TabsTrigger>
          <TabsTrigger value="applications">Simulate Applications</TabsTrigger>
        </TabsList>
      

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Create Test Notification</CardTitle>
                <CardDescription>Generate a test notification for the company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Company ID</label>
                  <Input
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="Enter company ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Notification Type</label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW_APPLICATION">New Application</SelectItem>
                      <SelectItem value="APPLICATION_STATUS_UPDATED">Application Status Updated</SelectItem>
                      <SelectItem value="PROFILE_VIEWS">Profile Views</SelectItem>
                      <SelectItem value="POTENTIAL_CANDIDATE">Potential Candidate</SelectItem>
                      <SelectItem value="NEW_REGION">New Region</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Test ${notificationType} notification`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Job ID (optional)</label>
                  <Input
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    placeholder="Enter job ID if applicable"
                  />
                </div>

                <Button onClick={createNotification} disabled={loading}>
                  {loading ? "Creating..." : "Create Notification"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile-views" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Simulate Profile Views</CardTitle>
                <CardDescription>Generate test profile views for analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Company ID</label>
                  <Input
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="Enter company ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter location" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Number of Views</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={viewCount}
                    onChange={(e) => setViewCount(Number.parseInt(e.target.value))}
                  />
                </div>

                <Button onClick={simulateProfileViews} disabled={loading}>
                  {loading ? "Simulating..." : "Simulate Views"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Simulate Job Application</CardTitle>
                <CardDescription>Create a test application notification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Company ID</label>
                  <Input
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="Enter company ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Job ID (optional)</label>
                  <Input
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    placeholder="Enter job ID or leave blank to use any job from the company"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Applicant Name</label>
                  <Input
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Enter applicant name"
                  />
                </div>

                <Button onClick={simulateApplication} disabled={loading}>
                  {loading ? "Simulating..." : "Simulate Application"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {companyId && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Summary Preview</CardTitle>
                <CardDescription>See how notifications appear in the UI</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSummary companyId={companyId} />
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  )
}

