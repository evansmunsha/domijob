import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CompanyNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold mb-4">Company Not Found</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        The company you're looking for doesn't exist or may have been removed.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/companies">View All Companies</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}

