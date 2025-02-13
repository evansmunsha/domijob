import { JobFilters } from "@/components/general/JobFilters";
import JobListings from "@/components/general/JobListings";
import JobListingsLoading from "@/components/general/JobListingsLoading";
import { Suspense } from "react";

type SearchParamsProps = {
  searchParams: Promise<{
    page?: string;
    jobTypes?: string;
    location?: string;
  }>;
};

export default async function Home({ searchParams }: SearchParamsProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const jobTypes = params.jobTypes?.split(",") || [];
  const location = params.location || "";

  // Create a composite key from all filter parameters
  const filterKey = `page=${currentPage};types=${jobTypes.join(
    ","
  )};location=${location}`;

  return (
    <div className="container mx-auto w-full sm:px-6 lg:px-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <JobFilters />
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Suspense key={filterKey} fallback={<JobListingsLoading />}>
            <JobListings
              currentPage={currentPage}
              jobTypes={jobTypes}
              location={location}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
