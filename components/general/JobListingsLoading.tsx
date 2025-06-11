import { Skeleton } from "@/components/ui/skeleton"

export default function JobListingsLoading() {
  return (
    <div className="flex flex-col w-full">
      {/* Header skeleton */}
      <div className="bg-gray-200 rounded-t-lg p-4 flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Job listings skeleton */}
      <div className="border border-gray-200 rounded-b-lg overflow-hidden">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="border-b border-gray-200 p-4">
              <div className="flex items-start gap-4">
                {/* Company logo skeleton */}
                <Skeleton className="h-12 w-12 rounded-md" />

                {/* Job details skeleton */}
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>

                    <div className="text-right">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>

                  {/* Tags skeleton */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Footer skeleton */}
      <div className="bg-gray-200 rounded-b-lg p-4 flex justify-between items-center mt-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center mt-6">
        <div className="flex gap-1">
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} className="h-10 w-10" />
            ))}
        </div>
      </div>
    </div>
  )
}
