import { JobFilters } from "@/components/general/JobFilters";
import JobListings from "@/components/general/JobListings";
import JobListingsLoading from "@/components/general/JobListingsLoading";
import { Suspense } from "react";

type SearchParamsProps = {
  searchParams: {
    page?: string;
    jobTypes?: string;
    location?: string;
    ref?: string; // <--- Add this
  };
};


export default function Home({ searchParams }: SearchParamsProps) {
  const currentPage = Number(searchParams.page) || 1;
  const jobTypes = searchParams.jobTypes?.split(",") || [];
  const location = searchParams.location || "";
  const refCode = searchParams?.ref;


  const filterKey = `page=${currentPage};types=${jobTypes.join(",")};location=${location}`;

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
