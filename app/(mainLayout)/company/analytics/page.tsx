import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { ProfileViewsChart } from "@/components/company/ProfileViewsChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart, TrendingUp, Users, Eye, Briefcase, Target } from "lucide-react"

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
          <TabsList className="w-full grid grid-cols-3 min-w-[300px]">
            <TabsTrigger value="profile-views" className="text-xs md:text-sm">
              <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">Profile Views</span>
              <span className="sm:hidden">Views</span>
            </TabsTrigger>
            <TabsTrigger value="job-performance" className="text-xs md:text-sm">
              <Briefcase className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">Job Performance</span>
              <span className="sm:hidden">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="candidate-matches" className="text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">Candidate Matches</span>
              <span className="sm:hidden">Matches</span>
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
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <Users className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Coming soon: Detailed visitor demographics and behavior analytics
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll be able to see where your visitors are coming from, their job titles, and more
                  </p>
                </div>
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
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <BarChart className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Coming soon: Profile engagement metrics and conversion rates
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Track how long visitors spend on your profile and what actions they take
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job-performance" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl flex items-center">
                  <Briefcase className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Job Performance
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  See how your job postings are performing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <LineChart className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Coming soon: Job views, application rates, and conversion metrics
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Track which job postings get the most attention and convert the best
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl flex items-center">
                  <Target className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Application Funnel
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Analyze your application conversion funnel
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <PieChart className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Coming soon: Application funnel analytics and optimization insights
                  </p>
                  <p className="text-xs text-muted-foreground">
                    See where candidates drop off in your application process
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidate-matches" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl flex items-center">
                  <Users className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Candidate Matches
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Analyze your candidate matching metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <Target className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Coming soon: Skill match rates, candidate quality scores, and hiring funnel analytics
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Find the best candidates for your open positions with AI-powered matching
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg lg:text-xl flex items-center">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Hiring Success
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Measure your hiring success metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <BarChart className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Coming soon: Time-to-hire, cost-per-hire, and quality-of-hire metrics
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Optimize your hiring process with data-driven insights
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
