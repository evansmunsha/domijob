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
    <div className="w-full max-w-full px-4 py-4 md:px-6 md:py-6">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">Company Analytics</h1>

      <Tabs defaultValue="profile-views" className="w-full">
        <TabsList className="w-full flex flex-wrap mb-4">
          <TabsTrigger value="profile-views" className="flex-1 min-w-[100px] text-sm md:text-base">Profile Views</TabsTrigger>
          <TabsTrigger value="job-performance" className="flex-1 min-w-[100px] text-sm md:text-base">Job Performance</TabsTrigger>
          <TabsTrigger value="candidate-matches" className="flex-1 min-w-[100px] text-sm md:text-base">Candidate Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="profile-views" className="mt-0">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="w-full h-full overflow-hidden">
              <ProfileViewsChart companyId={company.id} />
            </div>

            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl">Visitor Insights</CardTitle>
                <CardDescription className="text-xs md:text-sm">Learn more about who&apos;s viewing your company profile</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-muted-foreground text-sm">
                  Coming soon: Detailed visitor demographics and behavior analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job-performance" className="mt-0">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl">Job Performance</CardTitle>
                <CardDescription className="text-xs md:text-sm">See how your job postings are performing</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-muted-foreground text-sm">
                  Coming soon: Job views, application rates, and conversion metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidate-matches" className="mt-0">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl">Candidate Matches</CardTitle>
                <CardDescription className="text-xs md:text-sm">Analyze your candidate matching metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-muted-foreground text-sm">
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

