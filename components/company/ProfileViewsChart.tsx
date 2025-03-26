"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface ProfileViewsData {
  data: Array<{
    label: string
    views: number
  }>
  locations: Array<{
    location: string
    views: number
  }>
  period: string
  totalViews: number
}

export function ProfileViewsChart({ companyId }: { companyId: string }) {
  const [viewsData, setViewsData] = useState<ProfileViewsData | null>(null)
  const [period, setPeriod] = useState<"day" | "week" | "month">("week")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        console.log(`Fetching profile views data for company: ${companyId}, period: ${period}`)

        if (!companyId) {
          console.error("Missing companyId for profile views data")
          setError("Missing company ID")
          return
        }

        const res = await fetch(`/api/company/analytics/profile-views?period=${period}&companyId=${companyId}`)

        if (!res.ok) {
          const errorText = await res.text()
          console.error(`Error response (${res.status}):`, errorText)
          throw new Error(`Failed to fetch profile views data: ${res.status} ${res.statusText}`)
        }

        const json = await res.json()
        console.log("Profile views data:", json)
        setViewsData(json)
      } catch (error) {
        console.error("Error fetching profile views data:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch profile views data")
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchData()
    }
  }, [period, companyId])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Profile Views</CardTitle>
          {!loading && viewsData && <div className="text-sm font-medium">Total: {viewsData.totalViews}</div>}
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Error: {error}</p>
            <p className="mt-2 text-sm">Please try again later</p>
          </div>
        ) : viewsData ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewsData.data}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <div>
              <h4 className="text-sm font-medium mb-2">Top Locations</h4>
              <div className="space-y-2">
                {viewsData.locations.length > 0 ? (
                  viewsData.locations.slice(0, 5).map((loc) => (
                    <div key={loc.location} className="flex justify-between items-center">
                      <span className="text-sm">{loc.location}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-muted rounded-full h-2 mr-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (loc.views / viewsData.totalViews) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{loc.views}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No location data available</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">No profile views data available</div>
        )}
      </CardContent>
    </Card>
  )
}

