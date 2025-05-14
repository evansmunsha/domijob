import Link from "next/link"
import { Button } from "@/components/ui/button"
import { constructMetadata } from "@/lib/utils"

export const metadata = constructMetadata({
  title: "Page Not Found | Domijob",
  description: "The page you are looking for does not exist.",
  noIndex: true,
})

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/jobs">Browse Jobs</Link>
        </Button>
      </div>
    </div>
  )
}
