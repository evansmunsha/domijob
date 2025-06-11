import { JobFilters } from "@/components/general/JobFilters"
import JobListings from "@/components/general/JobListings"
import JobListingsLoading from "@/components/general/JobListingsLoading"
import { HeroSection } from "@/components/home/HeroSection"
import { Suspense } from "react"
import { AffiliateTracker } from "@/components/general/AffiliateTracker" // ✅ add this line
import { AffiliateConversionTracker } from "@/components/general/AffiliateConversionTracker"

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
      {/* ✅ Track the affiliate click on first load */}
      
    {refCode && <AffiliateTracker refCode={refCode} />}
    <AffiliateConversionTracker /> {/* ✅ Track one-time conversion */}

      {/* Hero section with benefits carousel */}
      <HeroSection />

      {/* Trusted by section */}
      <div className="container mx-auto mb-12 px-4 py-8">
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Trusted by leading companies</p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
          {["Microsoft", "Google", "Amazon", "Apple", "Meta", "Netflix", "Airbnb", "Uber"].map((company) => (
            <div key={company} className="text-gray-500 dark:text-gray-400 font-semibold">
              {company}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div id="job-listings" className="container mx-auto w-full px-4 pb-16">
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
