import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function LoadingOnboarding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex items-center gap-3 mb-10">
        <Skeleton className="h-12 w-12 rounded-md" /> {/* Logo */}
        <Skeleton className="h-8 w-[120px]" /> {/* Brand name */}
      </div>

      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-[100px]" /> {/* Step indicator */}
          <Skeleton className="h-4 w-[60px]" /> {/* Progress percentage */}
        </div>
        <Skeleton className="h-2 w-full rounded-full" /> {/* Progress bar */}
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <Skeleton className="h-7 w-[250px] mx-auto mb-2" /> {/* Title */}
                <Skeleton className="h-4 w-[300px] mx-auto" /> {/* Description */}
              </div>

              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" /> {/* Option 1 */}
                <Skeleton className="h-24 w-full rounded-lg" /> {/* Option 2 */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

