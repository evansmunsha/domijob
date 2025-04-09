import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { ProfileViewsChart } from "@/components/company/ProfileViewsChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CompanyAnalyticsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Verify user is a company
  if (session.user.userType !== "COMPANY") {
    redirect("/dashboard")
  }

  // Get the company
  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  })

  if (!company) {
    redirect("/onboarding")
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Company Analytics</h1>

      <Tabs defaultValue="profile-views" className="w-full space-y-6">
        {/* Use grid for tabs on mobile, flex for larger screens */}
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full min-w-[400px]">
            <TabsTrigger value="profile-views" className="flex-1">
              Profile Views
            </TabsTrigger>
            <TabsTrigger value="job-performance" className="flex-1">
              Job Performance
            </TabsTrigger>
            <TabsTrigger value="candidate-matches" className="flex-1">
              Candidate Matches
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile-views" className="space-y-6">
          {/* Full width chart on mobile, grid on larger screens */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Profile Views Over Time</CardTitle>
                <CardDescription>Track how many people are viewing your company profile</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileViewsChart companyId={company.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visitor Insights</CardTitle>
                <CardDescription>Learn more about who's viewing your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Coming soon: Detailed visitor demographics and behavior analytics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Understand how visitors interact with your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon: Profile engagement metrics and conversion rates.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job-performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Performance</CardTitle>
              <CardDescription>See how your job postings are performing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground text-center">
                  Coming soon: Job views, application rates, and conversion metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidate-matches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Matches</CardTitle>
              <CardDescription>Analyze your candidate matching metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground text-center">
                  Coming soon: Skill match rates, candidate quality scores, and hiring funnel analytics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
