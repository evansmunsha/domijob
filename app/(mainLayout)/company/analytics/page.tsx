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
    <div className="container py-4 md:py-8 px-4 md:px-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Company Analytics</h1>

      <Tabs defaultValue="profile-views" className="w-full">
        <TabsList className="w-full flex flex-wrap mb-4 md:mb-6">
          <TabsTrigger value="profile-views" className="flex-1 min-w-[120px]">Profile Views</TabsTrigger>
          <TabsTrigger value="job-performance" className="flex-1 min-w-[120px]">Job Performance</TabsTrigger>
          <TabsTrigger value="candidate-matches" className="flex-1 min-w-[120px]">Candidate Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="profile-views" className="mt-0">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
            <div className="w-full overflow-hidden">
              <ProfileViewsChart companyId={company.id} />
            </div>

            <Card className="w-full">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Visitor Insights</CardTitle>
                <CardDescription>Learn more about who&apos;s viewing your company profile</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <p className="text-muted-foreground">
                  Coming soon: Detailed visitor demographics and behavior analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job-performance" className="mt-0">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="w-full">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Job Performance</CardTitle>
                <CardDescription>See how your job postings are performing</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <p className="text-muted-foreground">
                  Coming soon: Job views, application rates, and conversion metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidate-matches" className="mt-0">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="w-full">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Candidate Matches</CardTitle>
                <CardDescription>Analyze your candidate matching metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
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

