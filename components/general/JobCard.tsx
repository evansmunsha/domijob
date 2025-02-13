"use client"

import Link from "next/link"
import { Card, CardHeader } from "../ui/card"
import { MapPin, User2 } from "lucide-react"
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
      logo: string | null
      name: string
      about: string
      location: string
    }
  }
}

export function JobCard({ job }: iAppProps) {
  return (
    <Link href={`/job/${job.id}`} className="block w-full">
      <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary relative w-full">
        <CardHeader className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-start gap-3">
              {job.company.logo ? (
                <Image
                  src={job.company.logo || "/placeholder.svg"}
                  alt={job.company.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User2 className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-grow min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold line-clamp-2 leading-tight mb-1">
                  {job.jobTitle}
                </h1>
                <p className="text-sm text-muted-foreground truncate">{job.company.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="rounded-full">
                {job.employmentType}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {job.location}
              </Badge>
              <p className="text-sm text-muted-foreground ml-auto">
                {formatCurrency(job.salaryFrom)} - {formatCurrency(job.salaryTo)}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
              <p className="text-muted-foreground">{formatRelativeTime(job.createdAt)}</p>
            </div>

            {job.company.about && <p className="text-sm text-muted-foreground line-clamp-2">{job.company.about}</p>}
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}


