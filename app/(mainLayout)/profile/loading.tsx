import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoadingProfile() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Profile Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Skeleton className="h-24 w-24 rounded-full" /> {/* Profile image */}
            <div className="flex-1 text-center md:text-left">
              <Skeleton className="h-8 w-[200px] mx-auto md:mx-0 mb-2" /> {/* Name */}
              <div className="flex flex-col md:flex-row gap-2 mt-2">
                <Skeleton className="h-5 w-[180px] mx-auto md:mx-0" /> {/* Email */}
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <Skeleton className="h-6 w-[100px]" /> {/* Badge */}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-[150px]" /> {/* Button */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="mt-8">
        <Skeleton className="h-10 w-full mb-6" /> {/* Tabs */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px] mb-2" /> {/* Card title */}
            <Skeleton className="h-4 w-[300px]" /> {/* Card description */}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Input */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Input */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" /> {/* Label */}
                <Skeleton className="h-32 w-full" /> {/* Textarea */}
              </div>
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-[100px]" /> {/* Button */}
                <Skeleton className="h-10 w-[100px]" /> {/* Button */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

