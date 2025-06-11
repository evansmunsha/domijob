"use client"

import { useState, useEffect } from "react"
import { JobCard } from "../general/JobCard"
import { JobFilters } from "../general/JobFilters"
import { PaginationComponent } from "../general/PaginationComponent"
import { EmptyState } from "../general/EmptyState"
import { Button } from "@/components/ui/button"
import { Sparkles, Briefcase, Rss, Bell, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"

interface Job {
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

interface JobListingsProps {
  initialJobs: Job[]
  totalPages: number
  currentPage: number
}

export function EnhancedJobListings({ initialJobs, totalPages, currentPage }: JobListingsProps) {
  const { theme } = useTheme()
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [visibleBenefit, setVisibleBenefit] = useState(0)

  const jobTypes = searchParams.get("jobTypes")?.split(",") || []
  const location = searchParams.get("location") || ""

  useEffect(() => {
    // Update active filters based on URL params
    const filters = []
    if (jobTypes.length > 0) filters.push(`${jobTypes.length} job types`)
    if (location) filters.push(location)
    setActiveFilters(filters)
  }, [jobTypes, location])

  // Benefits carousel
  const benefits = [
    {
      title: "AI-Powered Job Matching",
      description: "Our AI analyzes your skills to find the perfect job opportunities",
      icon: <Sparkles className="h-5 w-5 text-primary" />,
    },
    {
      title: "Save Valuable Time",
      description: "Focus your search on positions where you have the highest chance of success",
      icon: <Briefcase className="h-5 w-5 text-primary" />,
    },
    {
      title: "Personalized Alerts",
      description: "Get notified when new jobs matching your profile are posted",
      icon: <Bell className="h-5 w-5 text-primary" />,
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleBenefit((prev) => (prev + 1) % benefits.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [benefits.length])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6 p-3 bg-primary/5 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-medium mr-2">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span key={filter} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                  {filter}
                </span>
              ))}
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Clear all
            </Button>
          </Link>
        </div>
      )}

      {/* Benefits carousel */}
      <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={visibleBenefit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <div className="mr-4 h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              {benefits[visibleBenefit].icon}
            </div>
            <div>
              <h3 className="text-lg font-bold">{benefits[visibleBenefit].title}</h3>
              <p className="text-muted-foreground">{benefits[visibleBenefit].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex justify-center space-x-2">
          {benefits.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full ${index === visibleBenefit ? "bg-primary" : "bg-primary/20"}`}
              onClick={() => setVisibleBenefit(index)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="md:col-span-1">
          <JobFilters />
        </div>

        {/* Job listings */}
        <div className="md:col-span-3">
          {jobs.length > 0 ? (
            <div className="flex flex-col w-full">
              {/* Header section with action buttons */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg p-4 flex justify-between items-center">
                <h2 className="font-bold text-lg flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Remote Jobs
                </h2>
                <div className="flex gap-2">
                  <Link href="/post-job">
                    <Button size="sm" variant="secondary" className="text-xs">
                      Post a Job
                    </Button>
                  </Link>
                  <Link href="/create-alert">
                    <Button size="sm" variant="secondary" className="text-xs">
                      <Bell className="h-3.5 w-3.5 mr-1" />
                      Create Alert
                    </Button>
                  </Link>
                  <Link href="/rss">
                    <Button size="sm" variant="secondary" className="text-xs">
                      <Rss className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Job listings */}
              <div className="border border-border rounded-b-lg overflow-hidden bg-card">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <JobCard job={job} isHighlighted={index % 5 === 0} />
                  </motion.div>
                ))}
              </div>

              {/* Footer section with action buttons */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-b-lg p-4 flex justify-between items-center mt-4">
                <h2 className="font-bold text-lg flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Remote Jobs
                </h2>
                <div className="flex gap-2">
                  <Link href="/post-job">
                    <Button size="sm" variant="secondary" className="text-xs">
                      Post a Job
                    </Button>
                  </Link>
                  <Link href="/create-alert">
                    <Button size="sm" variant="secondary" className="text-xs">
                      <Bell className="h-3.5 w-3.5 mr-1" />
                      Create Alert
                    </Button>
                  </Link>
                  <Link href="/rss">
                    <Button size="sm" variant="secondary" className="text-xs">
                      <Rss className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <PaginationComponent totalPages={totalPages} currentPage={currentPage} />
              </div>
            </div>
          ) : (
            <EmptyState
              title="No jobs found"
              description="Try searching for a different job title or location."
              buttonText="Clear all filters"
              href="#job-listings"
            />
          )}
        </div>
      </div>

      {/* Premium features callout */}
      <div className="mt-12 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              Unlock Premium AI Features
            </h3>
            <p className="text-muted-foreground mt-1">
              Get personalized job matches, resume enhancement, and more with our AI tools
            </p>
          </div>
          <Link href="/ai-tools">
            <Button className="group">
              Explore AI Tools
              <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
