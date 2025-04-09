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

        // Update the API endpoint to match the one we created
        const res = await fetch(`/api/company/profile-views?period=${period}&companyId=${companyId}`)

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
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <CardTitle className="text-base md:text-lg">Profile Views</CardTitle>
          {!loading && viewsData && (
            <div className="flex justify-end">
              <div className="text-xs md:text-sm font-medium">Total: {viewsData.totalViews}</div>
            </div>
          )}
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "day" | "week" | "month")} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day" className="text-xs md:text-sm">Today</TabsTrigger>
            <TabsTrigger value="week" className="text-xs md:text-sm">This Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs md:text-sm">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-[200px] md:h-[250px] lg:h-[300px] w-full" />
          </div>
        ) : error ? (
          <div className="grid grid-cols-1 gap-2 py-4 md:py-6 text-center text-muted-foreground">
            <p className="text-sm">Error: {error}</p>
            <p className="text-xs md:text-sm">Please try again later</p>
          </div>
        ) : viewsData ? (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <div className="w-full h-[200px] md:h-[250px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viewsData.data}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <h4 className="text-xs md:text-sm font-medium">Top Locations</h4>
              <div className="grid grid-cols-1 gap-2">
                {viewsData.locations.length > 0 ? (
                  viewsData.locations.slice(0, 5).map((loc) => (
                    <div key={loc.location} className="grid grid-cols-2 items-center">
                      <span className="text-xs md:text-sm">{loc.location}</span>
                      <div className="flex items-center justify-end">
                        <div className="w-24 md:w-32 bg-muted rounded-full h-1.5 md:h-2 mr-2">
                          <div
                            className="bg-primary h-1.5 md:h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (loc.views / viewsData.totalViews) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs md:text-sm text-muted-foreground">{loc.views}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground">No location data available</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 py-4 md:py-6 text-center text-muted-foreground text-sm">
            No profile views data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

