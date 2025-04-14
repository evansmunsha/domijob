"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { Button } from "@/components/ui/button"

interface JobPerformanceProps {
  companyId: string
}

interface JobMetrics {
  jobId: string
  jobTitle: string
  views: number
  applications: number
  conversionRate: number
  viewsByUserType: Array<{
    type: string
    count: number
    percentage: number
  }>
  applicationsByUserType: Array<{
    type: string
    count: number
    percentage: number
  }>
}

interface PerformanceData {
  jobMetrics: JobMetrics[]
  performanceTrends: Array<{
    date: string
    totalViews: number
    totalApplications: number
    viewsByUserType: Array<{
      type: string
      count: number
    }>
    applicationsByUserType: Array<{
      type: string
      count: number
    }>
  }>
  period: string
  totalJobs: number
  totalViews: number
  totalApplications: number
  averageConversionRate: number
}

export function JobPerformance({ companyId }: JobPerformanceProps) {
  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/company/analytics/job-performance?companyId=${companyId}&period=${period}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch job performance data")
        }
        const data = await response.json()
        setData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job performance data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyId, period])

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-2">
      <p className="text-red-500">{error}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
    </div>
  )
  if (!data) return null

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-medium">Job Performance Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track how your job postings are performing over time
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-sm font-medium">Total Jobs</h3>
            <p className="text-2xl font-bold">{data.totalJobs}</p>
            <p className="text-xs text-muted-foreground">Active job postings</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-sm font-medium">Total Views</h3>
            <p className="text-2xl font-bold">{data.totalViews}</p>
            <p className="text-xs text-muted-foreground">Profile views</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-sm font-medium">Applications</h3>
            <p className="text-2xl font-bold">{data.totalApplications}</p>
            <p className="text-xs text-muted-foreground">Total applications received</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-sm font-medium">Conversion Rate</h3>
            <p className="text-2xl font-bold">{data.averageConversionRate}%</p>
            <p className="text-xs text-muted-foreground">Views to applications</p>
          </div>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Job Metrics</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="breakdown">User Type Breakdown</TabsTrigger>
          </TabsList>
          <TabsContent value="metrics" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Job Performance Comparison</h3>
              <p className="text-sm text-muted-foreground">
                Compare views and applications across your job postings
              </p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.jobMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jobTitle" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="views" fill="#8884d8" name="Views" />
                  <Bar yAxisId="right" dataKey="applications" fill="#82ca9d" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="trends" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Performance Over Time</h3>
              <p className="text-sm text-muted-foreground">
                Track how views and applications change over the selected period
              </p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalViews" stroke="#8884d8" name="Total Views" />
                  <Line type="monotone" dataKey="totalApplications" stroke="#82ca9d" name="Total Applications" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="breakdown" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">User Type Analysis</h3>
              <p className="text-sm text-muted-foreground">
                See how different user types interact with your job postings
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Views by User Type</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.jobMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jobTitle" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data.jobMetrics[0]?.viewsByUserType.map((type) => (
                        <Bar
                          key={type.type}
                          dataKey={`viewsByUserType.${type.type}`}
                          name={`${type.type} Views`}
                          stackId="views"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Applications by User Type</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.jobMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jobTitle" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data.jobMetrics[0]?.applicationsByUserType.map((type) => (
                        <Bar
                          key={type.type}
                          dataKey={`applicationsByUserType.${type.type}`}
                          name={`${type.type} Applications`}
                          stackId="applications"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 