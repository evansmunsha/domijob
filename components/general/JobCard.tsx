"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, Building2, Heart, ExternalLink, Loader2, CheckCircle, Clock, DollarSign } from "lucide-react"
import { Badge } from "../ui/badge"
import { formatCurrency } from "@/app/utils/formatCurrency"
import Image from "next/image"
import { formatRelativeTime } from "@/app/utils/formatRelativeTime"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { applyForJob, saveJobPost, unsaveJobPost } from "@/app/actions"
import { motion } from "framer-motion"

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
  const [isHovered, setIsHovered] = useState(false)
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
      toast.error(`${error instanceof Error ? error.message : "An error occurred while submitting your application."}`)
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
      className={`border-b border-border hover:bg-muted/30 transition-colors ${
        isHighlighted ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/job/${job.id}`} className="block p-4">
        <div className="flex items-start gap-4">
          {/* Company logo */}
          <div className="flex-shrink-0">
            <motion.div
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-12 h-12 rounded-md overflow-hidden bg-primary/10"
            >
              <Image
                src={job.company.logo || `https://avatar.vercel.sh/${job.company.name}`}
                alt={job.company.name}
                fill
                className="object-cover"
              />
            </motion.div>
          </div>

          {/* Job details */}
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                  <motion.span
                    animate={isHovered ? { x: 3 } : { x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                  >
                    {job.jobTitle}
                  </motion.span>
                </h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  <span>{job.company.name}</span>
                </div>
              </div>

              <div className="text-right text-muted-foreground text-sm">
                <div className="flex items-center justify-end">
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  <span>{formatSalary(job.salaryFrom, job.salaryTo)}</span>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>{formatRelativeTime(job.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Tags and action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                {job.employmentType}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3 mr-1" />
                {job.location || "Worldwide"}
              </Badge>

              {/* Apply button */}
              {hasApplied ? (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 border-green-500/30"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Already Applied
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-3 rounded-full"
                  onClick={handleApply}
                  disabled={isApplying}
                >
                  {isApplying && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {isApplying ? "Applying..." : "Apply Now"}
                </Button>
              )}

              {/* Save button */}
              <Button
                variant="outline"
                size="sm"
                className={`text-xs h-6 px-3 rounded-full flex items-center ${
                  savedJob ? "text-red-500 border-red-200 hover:bg-red-500/10" : ""
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

              {/* Details button */}
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6 px-3 rounded-full flex items-center"
                onClick={handleDetails}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Details
              </Button>
            </div>

            {/* Company description - only show if highlighted */}
            {isHighlighted && job.company.about && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.company.about}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
