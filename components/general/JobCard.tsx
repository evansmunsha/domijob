"use client"

import Link from "next/link"
import { MapPin, Building2, Heart, ExternalLink } from "lucide-react"
import { Badge } from "../ui/badge"
import { formatCurrency } from "@/app/utils/formatCurrency"
import Image from "next/image"
import { formatRelativeTime } from "@/app/utils/formatRelativeTime"

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
  // Format salary range
  const formatSalary = (from: number, to: number) => {
    if (!from && !to) return "Salary not specified"
    if (from && !to) return formatCurrency(from) + "+"
    if (!from && to) return "Up to " + formatCurrency(to)
    return `${formatCurrency(from)} - ${formatCurrency(to)}`
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

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                {job.employmentType}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3 mr-1" />
                {job.location || "Worldwide"}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                Apply Now
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                <Heart className="h-3 w-3 mr-1" />
                Save
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                <ExternalLink className="h-3 w-3 mr-1" />
                Details
              </Badge>
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
