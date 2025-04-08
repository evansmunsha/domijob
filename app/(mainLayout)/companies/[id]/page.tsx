"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Calendar, Users, X } from "lucide-react"
import Link from "next/link"

type Company = {
  id: string
  name: string
  userId: string
  logo: string | null
  location: string | null
  website: string | null
  about: string | null
  foundedYear: number | null
  size: string | null
  xAccount: string | null
  industry: string | null
  JobPost: Array<{
    id: string
    jobTitle: string
    location: string
    employmentType: string
    salaryFrom: number | null
    salaryTo: number | null
  }>
}

export default function CompanyProfile({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error('Failed to fetch company')
        }
        const data = await response.json()
        setCompany(data)
      } catch (error) {
        console.error('Error fetching company:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [params.id])

  useEffect(() => {
    if (!session?.user?.id || !session?.user?.userType || !company) return

    const viewerId = session.user.id

    // Only track if a job seeker is viewing a different company
    if (session.user.userType === "JOB_SEEKER" && viewerId !== company.userId) {
      fetch("/api/company/profile-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: params.id, viewerId }),
      }).catch((err) => console.error("Profile view tracking failed", err))
    }
  }, [session, company, params.id])

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!company) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-8">
        <div>
          <div className="flex items-center gap-6 mb-6">
            <Image
              src={company.logo || `https://avatar.vercel.sh/${company.name}`}
              alt={company.name}
              width={100}
              height={100}
              className="rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{company.location || "Remote"}</span>
                </div>
                {company.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Website
                    </a>
                  </div>
                )}
                {company.foundedYear && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Founded {company.foundedYear}</span>
                  </div>
                )}
                {company.size && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{company.size} employees</span>
                  </div>
                )}
                {company.xAccount && (
                  <div className="flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    <a
                      href={`https://twitter.com/${company.xAccount}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      @{company.xAccount}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="jobs">Jobs ({company.JobPost.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About {company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{company.about}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="jobs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions</CardTitle>
                  <CardDescription>
                    {company.JobPost.length > 0
                      ? `${company.JobPost.length} open positions at ${company.name}`
                      : `No open positions at ${company.name} at the moment`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {company.JobPost.length > 0 ? (
                    <div className="space-y-4">
                      {company.JobPost.map((job) => (
                        <div key={job.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <h3 className="font-medium text-lg">{job.jobTitle}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline">{job.location}</Badge>
                            <Badge>{job.employmentType}</Badge>
                            {job.salaryFrom && job.salaryTo && (
                              <span className="text-sm text-muted-foreground">
                                ${job.salaryFrom.toLocaleString()} - ${job.salaryTo.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/job/${job.id}`}>View Job</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Check back later for new opportunities.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Industry</h3>
                <p className="text-muted-foreground">{company.industry || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Company Size</h3>
                <p className="text-muted-foreground">{company.size || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Founded</h3>
                <p className="text-muted-foreground">{company.foundedYear || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Location</h3>
                <p className="text-muted-foreground">{company.location || "Not specified"}</p>
              </div>
              {company.website && (
                <div>
                  <h3 className="text-sm font-medium">Website</h3>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {company.xAccount && (
                <div>
                  <h3 className="text-sm font-medium">X (Twitter)</h3>
                  <a
                    href={`https://twitter.com/${company.xAccount}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @{company.xAccount}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{company.JobPost.length}</p>
              <Button asChild className="w-full mt-4">
                <Link href={`/jobs?company=${company.id}`}>View All Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
