"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Click {
  id: string
  timestamp: string
  source?: string
  campaign?: string
  converted: boolean
}

interface ClickAnalyticsProps {
  clicks: Click[]
}

export function ClickAnalytics({ clicks }: ClickAnalyticsProps) {
  // Group clicks by date
  const clickData = clicks.reduce((acc, click) => {
    const date = new Date(click.timestamp).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Convert to array for chart
  const chartData = Object.entries(clickData).map(([date, count]) => ({
    date,
    count
  }))

  // Calculate conversion rate
  const totalClicks = clicks.length
  const convertedClicks = clicks.filter(click => click.converted).length
  const conversionRate = totalClicks > 0 
    ? ((convertedClicks / totalClicks) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Click Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">{totalClicks}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{conversionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Click History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 