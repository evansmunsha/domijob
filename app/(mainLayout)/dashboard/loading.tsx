import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoadingDashboard() {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-10 w-[150px] mb-6" /> {/* Dashboard heading */}
          {/* Recommended Jobs Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px] mb-2" /> {/* Card title */}
              <Skeleton className="h-4 w-[300px]" /> {/* Card description */}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-md" /> {/* Company logo */}
                    <div className="flex-1">
                      <Skeleton className="h-5 w-[250px] mb-2" /> {/* Job title */}
                      <Skeleton className="h-4 w-[180px] mb-2" /> {/* Company name */}
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-6 w-[100px] rounded-full" /> {/* Badge */}
                        <Skeleton className="h-6 w-[120px] rounded-full" /> {/* Badge */}
                      </div>
                    </div>
                    <Skeleton className="h-9 w-[80px]" /> {/* Button */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Applications Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[180px] mb-2" /> {/* Card title */}
              <Skeleton className="h-4 w-[280px]" /> {/* Card description */}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <Skeleton className="h-12 w-12 rounded-full mb-4" /> {/* Icon */}
                <Skeleton className="h-6 w-[200px] mb-2" /> {/* Title */}
                <Skeleton className="h-4 w-[300px] mb-4" /> {/* Description */}
                <Skeleton className="h-10 w-[150px]" /> {/* Button */}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[120px] mb-2" /> {/* Card title */}
              <Skeleton className="h-4 w-[200px]" /> {/* Card description */}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" /> {/* Profile image */}
                  <div>
                    <Skeleton className="h-5 w-[150px] mb-1" /> {/* Name */}
                    <Skeleton className="h-4 w-[100px]" /> {/* Role */}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-[120px]" /> {/* Label */}
                    <Skeleton className="h-4 w-[40px]" /> {/* Percentage */}
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" /> {/* Progress bar */}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" /> {/* Icon */}
                    <Skeleton className="h-4 w-[120px]" /> {/* Text */}
                  </div>
                  <Skeleton className="h-10 w-full" /> {/* Button */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[120px]" /> {/* Card title */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" /> /* Button */
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

