import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoadingApplicationDetails() {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-6">
        <Skeleton className="h-4 w-[100px] mb-2" /> {/* Back link */}
        <Skeleton className="h-10 w-[300px]" /> {/* Page title */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" /> {/* Card title */}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md" /> {/* Company logo */}
                <div>
                  <Skeleton className="h-6 w-[250px] mb-2" /> {/* Job title */}
                  <Skeleton className="h-4 w-[180px]" /> {/* Company name */}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-[100px] mb-2" /> {/* Label */}
                  <Skeleton className="h-5 w-[150px]" /> {/* Value */}
                </div>
                <div>
                  <Skeleton className="h-4 w-[100px] mb-2" /> {/* Label */}
                  <Skeleton className="h-5 w-[150px]" /> {/* Value */}
                </div>
              </div>
              <Skeleton className="h-10 w-[200px]" /> {/* Button */}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" /> {/* Card title */}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-[100px]" /> {/* Label */}
                <Skeleton className="h-6 w-[100px] rounded-full" /> {/* Status badge */}
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" /> {/* Date info */}
                <Skeleton className="h-4 w-full" /> {/* Date info */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[120px]" /> {/* Card title */}
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" /> {/* Text */}
              <Skeleton className="h-4 w-full" /> {/* Text */}
              <Skeleton className="h-10 w-full" /> {/* Button */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

