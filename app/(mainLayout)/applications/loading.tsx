import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoadingApplications() {
  return (
    <div className="container py-8 max-w-7xl">
      <Skeleton className="h-10 w-[250px] mb-6" /> {/* Page title */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" /> {/* Card title */}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-md" /> {/* Company logo */}
                <div className="flex-1">
                  <Skeleton className="h-5 w-[250px] mb-2" /> {/* Job title */}
                  <Skeleton className="h-4 w-[180px] mb-2" /> {/* Company name */}
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-[100px] rounded-full" /> {/* Status badge */}
                    <Skeleton className="h-4 w-[120px]" /> {/* Applied date */}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-9 w-[120px]" /> {/* View details button */}
                  <Skeleton className="h-9 w-[120px]" /> {/* View job button */}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

