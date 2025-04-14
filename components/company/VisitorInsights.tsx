"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"

interface VisitorInsightsProps {
  companyId: string
}

interface VisitorData {
  demographics: Array<{ category: string; percentage: number }>
  behavior: Array<{ action: string; count: number }>
  trafficSources: Array<{ source: string; percentage: number }>
  timePatterns: Array<{ hour: string; views: number }>
  period: string
  unknownUsersCount?: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function VisitorInsights({ companyId }: VisitorInsightsProps) {
  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<VisitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/company/analytics/visitor-insights?companyId=${companyId}&period=${period}`)
        if (!response.ok) throw new Error("Failed to fetch data")
        const data = await response.json()
        setData(data)
        setError(null)
      } catch (err) {
        setError("Failed to load visitor insights")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyId, period])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return null

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg font-medium">Visitor Insights</CardTitle>
          {data.unknownUsersCount && data.unknownUsersCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Note: {data.unknownUsersCount} visitors could not be categorized
            </p>
          )}
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[120px] sm:w-[180px]">
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
        <Tabs defaultValue="demographics" className="w-full">
          <TabsList className="w-full flex overflow-x-auto text-xs sm:text-sm">
            <TabsTrigger value="demographics" className="whitespace-nowrap">Demographics</TabsTrigger>
            <TabsTrigger value="behavior" className="whitespace-nowrap">Behavior</TabsTrigger>
            <TabsTrigger value="sources" className="whitespace-nowrap">Traffic Sources</TabsTrigger>
            <TabsTrigger value="time" className="whitespace-nowrap">Time Patterns</TabsTrigger>
          </TabsList>
          <TabsContent value="demographics">
            <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={data.demographics}
                    dataKey="percentage"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, percent }) => (
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: '8px',
                          fill: '#333',
                          fontWeight: '500'
                        }}
                      >
                        {`${name}: ${(percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                    labelLine={true}
                  >
                    {data.demographics.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ 
                      paddingTop: '10px',
                      fontSize: '10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="behavior">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.behavior} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="action" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="sources">
            <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={data.trafficSources}
                    dataKey="percentage"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.trafficSources.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ 
                      paddingTop: '10px',
                      fontSize: '10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="time">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timePatterns} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 