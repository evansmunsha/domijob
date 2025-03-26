import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoadingCompanyDashboard() {
  return (
    <div className="container py-8 max-w-7xl">
      <Skeleton className="h-10 w-[250px] mb-6" /> {/* Page title */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Job Postings Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[180px]" /> {/* Card title */}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Job listings */}
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <Skeleton className="h-5 w-[200px]" /> {/* Job title */}
                      <Skeleton className="h-5 w-[80px]" /> {/* Applicants count */}
                    </div>
                  ))}
                </div>
                <Skeleton className="h-10 w-[150px] mt-4" /> {/* Post a New Job button */}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[120px]" /> {/* Card title */}
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full" /> {/* Edit Company Profile button */}
                <Skeleton className="h-10 w-full" /> {/* Manage Job Postings button */}
                <Skeleton className="h-10 w-full" /> {/* View All Applications button */}
                <Skeleton className="h-10 w-full" /> {/* View Analytics button */}
                <Skeleton className="h-10 w-full" /> {/* Potential Candidates button */}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notification Summary Card Skeleton */}
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[180px]" /> {/* Card title */}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-[100px]" /> {/* Total Unread label */}
                  <Skeleton className="h-6 w-[40px]" /> {/* Count badge */}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Skeleton className="h-4 w-4 mr-2" /> {/* Icon */}
                          <Skeleton className="h-4 w-[80px]" /> {/* Label */}
                        </div>
                        <Skeleton className="h-5 w-[30px]" /> {/* Count */}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between">
                  <Skeleton className="h-4 w-[120px]" /> {/* View all link */}
                  <Skeleton className="h-4 w-[120px]" /> {/* View candidates link */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

