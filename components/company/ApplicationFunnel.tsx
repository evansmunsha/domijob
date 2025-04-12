"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, BarChart2, LineChart, Users } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ApplicationFunnelProps {
  companyId: string
}

interface FunnelMetrics {
  stage: string
  count: number
  dropoffRate: number
  byUserType: Array<{
    type: string
    count: number
    percentage: number
  }>
}

interface FunnelData {
  funnelMetrics: FunnelMetrics[]
  conversionTrends: Array<{
    date: string
    totalApplications: number
    completedApplications: number
    applicationsByUserType: Array<{
      type: string
      count: number
    }>
    completedByUserType: Array<{
      type: string
      count: number
    }>
  }>
  period: string
  totalApplications: number
  completedApplications: number
  shortlistedApplications: number
  interviewedApplications: number
  hiredApplications: number
  overallConversionRate: number
}

export function ApplicationFunnel({ companyId }: ApplicationFunnelProps) {
  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState<FunnelMetrics | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/company/analytics/application-funnel?companyId=${companyId}&period=${period}`)
        if (!response.ok) throw new Error("Failed to fetch data")
        const data = await response.json()
        setData(data)
        setError(null)
      } catch (err) {
        setError("Failed to load application funnel data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyId, period])

  const handleStageClick = (stage: FunnelMetrics) => {
    setSelectedStage(stage)
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
  }

  const exportData = () => {
    if (!data) return

    const csvContent = [
      ["Stage", "Count", "Dropoff Rate", "User Type Breakdown"],
      ...data.funnelMetrics.map(stage => [
        stage.stage,
        stage.count,
        `${stage.dropoffRate}%`,
        stage.byUserType.map(t => `${t.type}: ${t.count} (${t.percentage}%)`).join(", ")
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `application-funnel-${period}.csv`
    link.click()
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return null

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-medium">Application Funnel</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.totalApplications} total • {data.hiredApplications} hired • {data.overallConversionRate}% conversion rate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
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
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="funnel">
              <BarChart2 className="mr-2 h-4 w-4" />
              Funnel Analysis
            </TabsTrigger>
            <TabsTrigger value="trends">
              <LineChart className="mr-2 h-4 w-4" />
              Conversion Trends
            </TabsTrigger>
            <TabsTrigger value="breakdown">
              <Users className="mr-2 h-4 w-4" />
              User Type Breakdown
            </TabsTrigger>
          </TabsList>
          <TabsContent value="funnel" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnelMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="count" 
                    fill="#8884d8" 
                    name="Count"
                    onClick={(data) => handleStageClick(data)}
                    cursor="pointer"
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="dropoffRate" 
                    fill="#82ca9d" 
                    name="Dropoff Rate (%)"
                    onClick={(data) => handleStageClick(data)}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="trends" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data.conversionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalApplications" 
                    stroke="#8884d8" 
                    name="Total Applications"
                    onClick={(data) => handleDateClick(data.date)}
                    cursor="pointer"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completedApplications" 
                    stroke="#82ca9d" 
                    name="Completed Applications"
                    onClick={(data) => handleDateClick(data.date)}
                    cursor="pointer"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Applications by User Type</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.funnelMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data.funnelMetrics[0]?.byUserType.map((type) => (
                        <Bar
                          key={type.type}
                          dataKey={`byUserType.${type.type}.count`}
                          name={`${type.type} Applications`}
                          stackId="applications"
                          onClick={(data) => handleStageClick(data)}
                          cursor="pointer"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Conversion by User Type</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.funnelMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data.funnelMetrics[0]?.byUserType.map((type) => (
                        <Bar
                          key={type.type}
                          dataKey={`byUserType.${type.type}.percentage`}
                          name={`${type.type} Conversion (%)`}
                          stackId="conversion"
                          onClick={(data) => handleStageClick(data)}
                          cursor="pointer"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog>
          <DialogTrigger asChild>
            <div className="hidden" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedStage ? `Stage Details: ${selectedStage.stage}` : 
                 selectedDate ? `Performance on ${selectedDate}` : ''}
              </DialogTitle>
            </DialogHeader>
            {selectedStage && (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Count</TableCell>
                      <TableCell>{selectedStage.count}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dropoff Rate</TableCell>
                      <TableCell>{selectedStage.dropoffRate}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div>
                  <h4 className="font-medium mb-2">User Type Breakdown</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Type</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStage.byUserType.map((type) => (
                        <TableRow key={type.type}>
                          <TableCell>{type.type}</TableCell>
                          <TableCell>{type.count}</TableCell>
                          <TableCell>{type.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {selectedDate && (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Applications</TableCell>
                      <TableCell>{data.conversionTrends.find(t => t.date === selectedDate)?.totalApplications || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Completed Applications</TableCell>
                      <TableCell>{data.conversionTrends.find(t => t.date === selectedDate)?.completedApplications || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div>
                  <h4 className="font-medium mb-2">Applications by User Type</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Type</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.conversionTrends.find(t => t.date === selectedDate)?.applicationsByUserType.map((type) => (
                        <TableRow key={type.type}>
                          <TableCell>{type.type}</TableCell>
                          <TableCell>{type.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Completed by User Type</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Type</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.conversionTrends.find(t => t.date === selectedDate)?.completedByUserType.map((type) => (
                        <TableRow key={type.type}>
                          <TableCell>{type.type}</TableCell>
                          <TableCell>{type.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 