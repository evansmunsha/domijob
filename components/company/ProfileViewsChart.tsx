"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Download, Calendar, TrendingUp, AlertCircle, Info } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface ProfileViewsData {
  data: Array<{
    date: string
    views: number
  }>
  locations: Array<{
    country: string
    views: number
  }>
  period: string
  totalViews: number
  trend: number // Percentage change from previous period
}

interface ProfileViewsChartProps {
  companyId: string
}

export function ProfileViewsChart({ companyId }: ProfileViewsChartProps) {
  const [viewsData, setViewsData] = useState<ProfileViewsData | null>(null)
  const [period, setPeriod] = useState<"day" | "week" | "month">("week")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">("30d")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        console.log(`Fetching profile views data for company: ${companyId}, period: ${period}, range: ${dateRange}`)

        if (!companyId) {
          console.error("Missing companyId for profile views data")
          setError("Missing company ID")
          return
        }

        // Update the API endpoint to match the one we created
        const res = await fetch(`/api/companies/${companyId}/analytics/views?period=${period}&range=${dateRange}`)

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
  }, [period, companyId, dateRange])

  const handleExportCSV = () => {
    if (!viewsData) return
    
    // Create CSV content
    const headers = ["Date", "Views"]
    const rows = viewsData.data.map(item => [item.date, item.views])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `profile-views-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTrendIndicator = (trend: number) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          <span>{Math.abs(trend)}%</span>
        </div>
      )
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDownRight className="h-4 w-4 mr-1" />
          <span>{Math.abs(trend)}%</span>
        </div>
      )
    } else {
      return <span className="text-xs text-muted-foreground">0%</span>
    }
  }

  const getRecommendations = () => {
    if (!viewsData) return null
    
    const recommendations = []
    const { trend, totalViews } = viewsData

    if (trend < 0) {
      recommendations.push({
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        text: "Profile views are declining. Consider updating your company profile with recent achievements and news.",
      })
    }

    if (totalViews < 100) {
      recommendations.push({
        icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
        text: "Low profile visibility. Try sharing your company profile on social media and professional networks.",
      })
    }

    return recommendations
  }

  const recommendations = getRecommendations()

  return (
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-base md:text-lg lg:text-xl">Profile Views</CardTitle>
          <div className="flex items-center gap-2">
            {!loading && viewsData && (
              <>
                <div className="text-xs md:text-sm font-medium">Total: {viewsData.totalViews}</div>
                {viewsData.trend !== undefined && getTrendIndicator(viewsData.trend)}
              </>
            )}
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as "7d" | "30d" | "90d" | "custom")}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs" 
              onClick={handleExportCSV}
              disabled={loading || !viewsData}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
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
          <div className="space-y-4">
            <Skeleton className="h-[200px] md:h-[250px] lg:h-[300px] w-full" />
          </div>
        ) : error ? (
          <div className="py-4 md:py-6 text-center text-muted-foreground">
            <p className="text-sm">Error: {error}</p>
            <p className="mt-2 text-xs md:text-sm">Please try again later</p>
          </div>
        ) : viewsData ? (
          <div className="space-y-4 md:space-y-6">
            {recommendations && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      {rec.icon}
                      <p>{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="w-full h-[200px] md:h-[250px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }}
                  />
                  <Bar 
                    dataKey="views" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-xs md:text-sm font-medium mb-2">Top Locations</h4>
              <div className="space-y-2">
                {viewsData.locations.length > 0 ? (
                  viewsData.locations.slice(0, 5).map((loc) => (
                    <div key={loc.country} className="flex justify-between items-center">
                      <span className="text-xs md:text-sm">{loc.country}</span>
                      <div className="flex items-center">
                        <div className="w-24 md:w-32 bg-muted rounded-full h-1.5 md:h-2 mr-2">
                          <div
                            className="bg-primary h-1.5 md:h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (loc.views / viewsData.totalViews) * 100)}%`,
                            }}
                          />
                        </div>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs md:text-sm text-muted-foreground cursor-help">
                                {loc.views}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{loc.views} views from {loc.country}</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
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
          <div className="py-4 md:py-6 text-center text-muted-foreground text-sm">No profile views data available</div>
        )}
      </CardContent>
    </Card>
  )
}
