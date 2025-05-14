"use client"

import type React from "react"

import Link from "next/link"
import { MapPin, Building2, Heart, ExternalLink } from "lucide-react"
import { Badge } from "../ui/badge"
import { formatCurrency } from "@/app/utils/formatCurrency"
import Image from "next/image"
import { formatRelativeTime } from "@/app/utils/formatRelativeTime"
import { Button } from "../ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
  const [isSaved, setIsSaved] = useState(false)
  const router = useRouter()

  // Format salary range
  const formatSalary = (from: number, to: number) => {
    if (!from && !to) return "Salary not specified"
    if (from && !to) return formatCurrency(from) + "+"
    if (!from && to) return "Up to " + formatCurrency(to)
    return `${formatCurrency(from)} - ${formatCurrency(to)}`
  }

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/job/${job.id}/apply`)
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved(!isSaved)
    toast.success(isSaved ? "Job removed from saved jobs" : "Job saved successfully")
  }

  const handleDetails = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/job/${job.id}`)
  }

  return (
    <div
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${isHighlighted ? "bg-yellow-50" : ""}`}
    >
      <Link href={`/job/${job.id}`} className="block p-4">
        <div className="flex items-start gap-4">
          {/* Company logo */}
          <div className="flex-shrink-0">
            <Image
              src={job.company.logo || `https://avatar.vercel.sh/${job.company.name}`}
              alt={job.company.name}
              width={48}
              height={48}
              className="rounded-md"
            />
          </div>

          {/* Job details */}
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <h3 className="font-bold text-lg">{job.jobTitle}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Building2 className="h-3 w-3 mr-1" />
                  <span>{job.company.name}</span>
                </div>
              </div>

              <div className="text-right text-gray-600 text-sm">
                <div>{formatSalary(job.salaryFrom, job.salaryTo)}</div>
                <div>{formatRelativeTime(job.createdAt)}</div>
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

              {/* Action buttons */}
              <Button variant="outline" size="sm" className="text-xs h-5 px-2 rounded-full" onClick={handleApply}>
                Apply Now
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`text-xs h-5 px-2 rounded-full flex items-center ${isSaved ? "text-red-500" : ""}`}
                onClick={handleSave}
              >
                <Heart className="h-3 w-3 mr-1" fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved" : "Save"}
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

            {/* Company description - only show if highlighted */}
            {isHighlighted && job.company.about && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.company.about}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
