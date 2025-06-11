import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Users } from "lucide-react"
import Link from "next/link"

export function FeatureHighlights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New </CardTitle>
        <CardDescription>Check out these new tools to enhance your recruiting</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full p-2 bg-primary/10">
            <BarChart className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Analytics Dashboard</h4>
            <p className="text-sm text-muted-foreground">Track profile views, geographic insights, and more</p>
            <Button variant="link" size="sm" className="p-0 h-auto" asChild>
              <Link href="/company/analytics">View Analytics</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="rounded-full p-2 bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Potential Candidates</h4>
            <p className="text-sm text-muted-foreground">
              Discover job seekers with matching skills who viewed your profile
            </p>
            <Button variant="link" size="sm" className="p-0 h-auto" asChild>
              <Link href="/company/potential-candidates">View Candidates</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

