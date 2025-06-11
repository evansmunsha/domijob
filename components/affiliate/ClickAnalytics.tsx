"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"

interface Click {
  id: string
  timestamp: string
  source: string
  converted: boolean
}

interface ClickAnalyticsProps {
  clicks: Click[]
}

export function ClickAnalytics({ clicks }: ClickAnalyticsProps) {
  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date)
  }

  // Get unique sources and count clicks by source
  const getSourceStats = () => {
    const sources: Record<string, number> = {}
    clicks.forEach(click => {
      const source = click.source || 'direct'
      sources[source] = (sources[source] || 0) + 1
    })
    return Object.entries(sources).map(([name, value]) => ({ name, value }))
  }

  // Get click counts by day for the chart
  const getClicksByDay = () => {
    const days: Record<string, number> = {}
    clicks.forEach(click => {
      const date = new Date(click.timestamp)
      const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0]
      days[day] = (days[day] || 0) + 1
    })
    return Object.entries(days)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10) // Last 10 days
  }

  const sourceStats = getSourceStats()
  const clicksByDay = getClicksByDay()
  const conversionRate = clicks.length 
    ? Math.round((clicks.filter(c => c.converted).length / clicks.length) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceStats.length > 0 ? (
              <ul className="space-y-2">
                {sourceStats.map(({ name, value }) => (
                  <li key={name} className="flex justify-between items-center">
                    <span className="capitalize">{name}</span>
                    <Badge variant="outline">{value}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-4">No click data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold">{conversionRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {clicks.filter(c => c.converted).length} conversions from {clicks.length} clicks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {clicks.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {clicks.slice(0, 3).map((click) => (
                  <li key={click.id} className="text-muted-foreground">
                    <span className={click.converted ? "text-green-600 dark:text-green-400" : ""}>
                      {click.converted ? "✓ " : ""}
                      {formatDate(click.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Click Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {clicksByDay.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clicksByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[300px]">
              <p className="text-muted-foreground">Not enough data to display trends</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          {clicks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left font-medium">Time</th>
                    <th className="py-3 text-left font-medium">Source</th>
                    <th className="py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.slice(0, 10).map((click) => (
                    <tr key={click.id} className="border-b">
                      <td className="py-3">{formatDate(click.timestamp)}</td>
                      <td className="py-3 capitalize">{click.source || "direct"}</td>
                      <td className="py-3">
                        <Badge variant={click.converted ? "default" : "secondary"}>
                          {click.converted ? "Converted" : "Clicked"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No click data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 