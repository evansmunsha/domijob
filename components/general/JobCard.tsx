"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, Building2, Heart, ExternalLink, Loader2 } from "lucide-react"
import { Badge } from "../ui/badge"
import { formatCurrency } from "@/app/utils/formatCurrency"
import Image from "next/image"
import { formatRelativeTime } from "@/app/utils/formatRelativeTime"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { applyForJob, saveJobPost, unsaveJobPost } from "@/app/actions"

interface iAppProps {
  job: {
    id: string
    jobTitle: string
    salaryFrom: number
    salaryTo: number
    employmentType: string
    location: string
    createdAt: Date
    company: {
      id: string
      logo: string | null
      name: string
      about: string
      location: string
    }
  }
  isHighlighted?: boolean
}

export function JobCard({ job, isHighlighted = false }: iAppProps) {
  const [savedJob, setSavedJob] = useState<{ id: string } | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [session, setSession] = useState<{ user?: { id?: string } } | null>(null)
  const router = useRouter()

  const formatSalary = (from: number, to: number) => {
    if (!from && !to) return "Salary not specified"
    if (from && !to) return formatCurrency(from) + "+"
    if (!from && to) return "Up to " + formatCurrency(to)
    return `${formatCurrency(from)} - ${formatCurrency(to)}`
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session")
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          setSession(sessionData)

          if (sessionData?.user) {
            const [savedResponse, appliedResponse] = await Promise.all([
              fetch(`/api/jobs/${job.id}/saved`),
              fetch(`/api/jobs/${job.id}/applied`),
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
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [job.id])

  const handleApply = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      router.push(`/login?callbackUrl=/job/${job.id}`)
      return
    }

    setIsApplying(true)
    try {
      await applyForJob(job.id)
      toast("Application submitted", {
        description: "Your application has been sent to the company.",
      })
      setHasApplied(true)
    } catch (error) {
      toast(`${error instanceof Error ? error.message : "An error occurred while submitting your application."}`)
    } finally {
      setIsApplying(false)
    }
  }

  const handleSaveJob = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      router.push(`/login?callbackUrl=/job/${job.id}`)
      return
    }

    setIsSaving(true)
    try {
      if (savedJob) {
        await unsaveJobPost(savedJob.id)
        setSavedJob(null)
        toast.success("Job removed from saved jobs")
      } else {
        const result = await saveJobPost(job.id)
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

  const handleDetails = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/job/${job.id}`)
  }

  return (
    <div
      className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        isHighlighted ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
      }`}
    >
      <Link href={`/job/${job.id}`} className="block p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Image
              src={job.company.logo || `https://avatar.vercel.sh/${job.company.name}`}
              alt={job.company.name}
              width={48}
              height={48}
              className="rounded-md"
            />
          </div>

          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{job.jobTitle}</h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <Building2 className="h-3 w-3 mr-1" />
                  <span>{job.company.name}</span>
                </div>
              </div>

              <div className="text-right text-gray-600 dark:text-gray-400 text-sm">
                <div>{formatSalary(job.salaryFrom, job.salaryTo)}</div>
                <div>{formatRelativeTime(job.createdAt)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                {job.employmentType}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location || "Worldwide"}
              </Badge>

              {hasApplied ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-5 px-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-700"
                  disabled
                  onClick={(e) => e.preventDefault()}
                >
                  Already Applied
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-5 px-2 rounded-full"
                  onClick={handleApply}
                  disabled={isApplying}
                >
                  {isApplying && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {isApplying ? "Applying..." : "Apply Now"}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className={`text-xs h-5 px-2 rounded-full flex items-center ${
                  savedJob ? "text-red-500 dark:text-red-400" : ""
                }`}
                onClick={handleSaveJob}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Heart className="h-3 w-3 mr-1" fill={savedJob ? "currentColor" : "none"} />
                )}
                {isSaving ? "Saving..." : savedJob ? "Saved" : "Save"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs h-5 px-2 rounded-full flex items-center"
                onClick={handleDetails}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Details
              </Button>
            </div>

            {isHighlighted && job.company.about && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{job.company.about}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
