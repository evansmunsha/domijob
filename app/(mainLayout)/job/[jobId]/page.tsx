"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { applyForJob, saveJobPost, unsaveJobPost } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader2 } from "lucide-react"
import { JsonToHtml } from "@/components/general/JsonToHtml"
import { benefits } from "@/app/utils/listOfBenefits"
import { getFlagEmoji } from "@/app/utils/countriesList"
import { toast } from "sonner"
import LoadingJobPage from "./loading"
import { ApplicationInsights } from "@/components/job/ApplicationInsights"

// Define proper interfaces for our state variables
interface Company {
  id: string
  name: string
  logo: string | null
  about?: string
}

interface JobData {
  id: string
  jobTitle: string
  jobDescription: string
  employmentType: string
  location: string
  benefits: string[]
  createdAt: string
  listingDuration: number
  company: Company
}

interface SavedJob {
  id: string
}

interface SessionData {
  user?: {
    id?: string
    name?: string
    email?: string
  }
}

export default function JobIdPage({ params }: { params: Promise<{ jobId: string }> }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const jobId = resolvedParams.jobId

  // Use a ref to track if we've already started fetching data
  const dataFetchedRef = useRef(false)

  const [jobData, setJobData] = useState<JobData | null>(null)
  const [savedJob, setSavedJob] = useState<SavedJob | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionData | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const router = useRouter()

  // Use useEffect with a ref to prevent duplicate fetches
  useEffect(() => {
    // Only fetch data if we haven't already started fetching
    if (dataFetchedRef.current === false) {
      dataFetchedRef.current = true

      const fetchJobData = async () => {
        try {
          // Fetch job data
          const jobResponse = await fetch(`/api/jobs/${jobId}`)
          if (!jobResponse.ok) {
            if (jobResponse.status === 404) {
              router.push("/404")
              return
            }
            throw new Error("Failed to fetch job data")
          }

          const data = await jobResponse.json()
          setJobData(data)

          // Fetch session data
          const sessionResponse = await fetch("/api/auth/session")
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            setSession(sessionData)

            // If user is logged in, check if they've saved or applied for this job
            if (sessionData?.user) {
              const [savedResponse, appliedResponse] = await Promise.all([
                fetch(`/api/jobs/${jobId}/saved`),
                fetch(`/api/jobs/${jobId}/applied`),
              ])

              if (savedResponse.ok) {
                const savedData = await savedResponse.json()
                setSavedJob(savedData)
              }

              if (appliedResponse.ok) {
                setHasApplied(true)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching job data:", error)
          toast.error("Failed to load job data")
        } finally {
          setLoading(false)
        }
      }

      fetchJobData()
    }
  }, [jobId, router])

  const handleApply = async () => {
    if (!session?.user) {
      // Redirect to login if not logged in
      router.push(`/login?callbackUrl=/job/${jobId}`)
      return
    }

    setIsApplying(true)
    try {
      await applyForJob(jobId)
      toast("Application submitted", {
        description: "Your application has been sent to the company.",
      })

      // Update local state to reflect that user has applied
      setHasApplied(true)
    } catch (error) {
      toast(`${error instanceof Error ? error.message : "An error occurred while submitting your application."}`)
    } finally {
      setIsApplying(false)
    }
  }

  const handleSaveJob = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/job/${jobId}`)
      return
    }

    setIsSaving(true)
    try {
      if (savedJob) {
        await unsaveJobPost(savedJob.id)
        setSavedJob(null)
        toast.success("Job removed from saved jobs")
      } else {
        const result = await saveJobPost(jobData!.id)
        setSavedJob(result)
        toast.success("Job saved successfully")
      }
    } catch (error) {
      toast.error("Failed to save job")
      console.error("Error saving job:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <LoadingJobPage />
  if (!jobData)
    return (
      <div className="container max-w-3xl mx-auto my-auto py-8">
        <p>Job not found</p>
      </div>
    )

  const locationFlag = jobData.location ? getFlagEmoji(jobData.location) : null

  return (
    <div className="container mx-auto py-8">
      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        {/* Main Content */}
        <div className="space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">{jobData.jobTitle}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-medium">{jobData.company.name}</span>
                <Badge className="text-sm rounded-full" variant="secondary">
                  {jobData.employmentType}
                </Badge>
                <Badge className="text-sm rounded-full">
                  {locationFlag && <span className="mr-1">{locationFlag}</span>}
                  {jobData.location} Only
                </Badge>
              </div>
            </div>

            {session?.user ? (
              <Button variant="outline" onClick={handleSaveJob} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Heart className="size-4 mr-2" fill={savedJob ? "currentColor" : "none"} />
                {savedJob ? "Saved" : "Save Job"}
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/login">
                  <Heart className="size-4 mr-2" />
                  Save Job
                </Link>
              </Button>
            )}
          </div>

          <section>
            <JsonToHtml json={JSON.parse(jobData.jobDescription)} />
          </section>

          <section>
            <h3 className="font-semibold mb-4">Benefits</h3>
            <div className="flex flex-wrap gap-3">
              {benefits.map((benefit) => {
                const isOffered = jobData.benefits.includes(benefit.id)
                return (
                  <Badge
                    key={benefit.id}
                    variant={isOffered ? "default" : "outline"}
                    className={`text-sm px-4 py-1.5 rounded-full ${!isOffered ? "opacity-75 cursor-not-allowed" : ""}`}
                  >
                    {benefit.icon} {benefit.label}
                  </Badge>
                )
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Apply now</h3>
              <p className="text-sm text-muted-foreground">
                Please let {jobData.company.name} know you found this job on domijob.
              </p>
              {hasApplied ? (
                <Button disabled className="w-full">
                  Already Applied
                </Button>
              ) : (
                <Button onClick={handleApply} disabled={isApplying} className="w-full">
                  {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isApplying ? "Applying..." : "Apply now"}
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold">About the job</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Apply before</span>
                <span className="text-sm">
                  {new Date(
                    new Date(jobData.createdAt).getTime() + jobData.listingDuration * 86400000,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location</span>
                <Badge variant="secondary">{jobData.location}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Image
                  src={jobData.company.logo || `https://avatar.vercel.sh/${jobData.company.name}`}
                  alt={jobData.company.name}
                  width={48}
                  height={48}
                  className="rounded-full size-12"
                />
                <div>
                  <h3 className="font-semibold">{jobData.company.name}</h3>
                  <p className="text-sm text-muted-foreground">{jobData.company.about}</p>
                </div>
              </div>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/companies/${jobData.company.id}`}>View company profile</Link>
                </Button>
              </CardFooter>
            </div>
          </Card>

          <ApplicationInsights jobId={jobId} />
        </div>
      </div>
    </div>
  )
}

