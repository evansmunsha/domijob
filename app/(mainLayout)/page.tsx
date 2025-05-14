import { JobFilters } from "@/components/general/JobFilters"
import JobListings from "@/components/general/JobListings"
import JobListingsLoading from "@/components/general/JobListingsLoading"
import { BenefitsCarousel } from "@/components/home/BenefitsCarousel"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type SearchParamsProps = {
  searchParams: {
    page?: string
    jobTypes?: string
    location?: string
    ref?: string
  }
}

export default function Home({ searchParams }: SearchParamsProps) {
  const currentPage = Number(searchParams.page) || 1
  const jobTypes = searchParams.jobTypes?.split(",") || []
  const location = searchParams.location || ""
  const refCode = searchParams?.ref

  const filterKey = `page=${currentPage};types=${jobTypes.join(",")};location=${location}`

  return (
    <>
      {/* Hero section */}
      <div className=" from-blue-600 to-indigo-700 text-white py-12 mb-8">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Remote Jobs Anywhere</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Domijob is an AI-driven job board connecting job seekers and recruiters. Find your next opportunity or hire
            top talent efficiently.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="#job-listings">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                Find Jobs
              </Button>
            </Link>
            <Link href="/post-job">
              <Button size="lg" variant="outline" className="border-white  hover:bg-blue-700">
                Post a Job
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits carousel */}
      <div className="container mx-auto mb-8 px-4">
        <BenefitsCarousel />
      </div>

      {/* Trusted by section */}
      <div className="container mx-auto mb-12 px-4">
        <p className="text-center text-gray-500 mb-6">Trusted by leading companies</p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
          {["Microsoft", "Google", "Amazon", "Apple", "Meta", "Netflix", "Airbnb", "Uber"].map((company) => (
            <div key={company} className="text-gray-400 font-semibold">
              {company}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div id="job-listings" className="container mx-auto w-full px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <JobFilters />
          </div>
          <div className="md:col-span-3">
            <Suspense key={filterKey} fallback={<JobListingsLoading />}>
              <JobListings currentPage={currentPage} jobTypes={jobTypes} location={location} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}
