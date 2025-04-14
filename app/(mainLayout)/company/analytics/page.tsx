import { VisitorInsights } from "@/components/company/VisitorInsights"
import { ApplicationInsights } from "@/components/company/ApplicationInsights"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { ProfileViewsChart } from "@/components/company/ProfileViewsChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Eye, Target } from "lucide-react"

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
        <div className="overflow-x-auto pb-2 mb-4">
          <TabsList className="w-full grid grid-cols-1 min-w-[300px]">
            <TabsTrigger value="profile-views" className="text-xs md:text-sm">
              <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">Profile Views</span>
              <span className="sm:hidden">Views</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile-views" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Card className="w-full h-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-base md:text-lg lg:text-xl flex items-center">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Profile Views Over Time
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Track how many people are viewing your company profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ProfileViewsChart companyId={company.id} />
                </CardContent>
              </Card>
            </div>

            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl flex items-center">
                  <Users className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Visitor Insights
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Learn more about who&apos;s viewing your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <VisitorInsights companyId={company.id} />
              </CardContent>
            </Card>

            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl flex items-center">
                  <Target className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Engagement Metrics
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Understand how visitors interact with your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ApplicationInsights companyId={company.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
