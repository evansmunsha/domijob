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
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Company Analytics</h1>

      <Tabs defaultValue="profile-views">
        <TabsList className="mb-6">
          <TabsTrigger value="profile-views">Profile Views</TabsTrigger>
          <TabsTrigger value="job-performance">Job Performance</TabsTrigger>
          <TabsTrigger value="candidate-matches">Candidate Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="profile-views">
          <div className="grid gap-6 md:grid-cols-2">
            <ProfileViewsChart companyId={company.id} />

            <Card>
              <CardHeader>
                <CardTitle>Visitor Insights</CardTitle>
                <CardDescription>Learn more about who's viewing your company profile</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Coming soon: Detailed visitor demographics and behavior analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job-performance">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Performance</CardTitle>
                <CardDescription>See how your job postings are performing</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Coming soon: Job views, application rates, and conversion metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidate-matches">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Matches</CardTitle>
                <CardDescription>Analyze your candidate matching metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Coming soon: Skill match rates, candidate quality scores, and hiring funnel analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

