import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Calendar,
  CreditCard,
  UserPlus,
  Activity
} from "lucide-react"

async function getGrowthMetrics() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // User metrics
  const [
    totalUsers,
    newUsersThisMonth,
    newUsersThisWeek,
    totalJobSeekers,
    totalCompanies
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { userType: "JOB_SEEKER" } }),
    prisma.user.count({ where: { userType: "COMPANY" } })
  ])

  // Revenue metrics
  const [
    totalCreditsUsed,
    creditsUsedThisMonth,
    totalRevenue,
    revenueThisMonth
  ] = await Promise.all([
    prisma.aIUsageLog.aggregate({ _sum: { cost: true } }),
    prisma.aIUsageLog.aggregate({ 
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { cost: true } 
    }),
    prisma.aIUsageLog.aggregate({ _sum: { cost: true } }),
    prisma.aIUsageLog.aggregate({ 
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { cost: true } 
    })
  ])

  // Feature usage
  const [
    resumeEnhancements,
    jobMatches,
    activeJobs
  ] = await Promise.all([
    prisma.aIUsageLog.count({ where: { endpoint: "resume_enhancement" } }),
    prisma.aIUsageLog.count({ where: { endpoint: "job_matching" } }),
    prisma.jobPost.count({ where: { status: "ACTIVE" } })
  ])

  // Growth rates
  const userGrowthRate = totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0
  const weeklyGrowthRate = totalUsers > 0 ? (newUsersThisWeek / totalUsers) * 100 : 0

  return {
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
      newThisWeek: newUsersThisWeek,
      jobSeekers: totalJobSeekers,
      companies: totalCompanies,
      growthRate: userGrowthRate,
      weeklyGrowthRate: weeklyGrowthRate
    },
    revenue: {
      total: totalRevenue._sum.cost || 0,
      thisMonth: revenueThisMonth._sum.cost || 0,
      creditsUsed: totalCreditsUsed._sum.cost || 0,
      creditsThisMonth: creditsUsedThisMonth._sum.cost || 0
    },
    features: {
      resumeEnhancements,
      jobMatches,
      activeJobs
    }
  }
}

export default async function GrowthDashboard() {
  const session = await auth()

  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/login")
  }

  const metrics = await getGrowthMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Growth Dashboard</h1>
        <p className="text-muted-foreground">
          Track key metrics and growth indicators for DomiJob
        </p>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.total}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.users.newThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.users.growthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.users.weeklyGrowthRate.toFixed(1)}% this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Seekers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.jobSeekers}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.users.jobSeekers / metrics.users.total) * 100).toFixed(1)}% of users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.companies}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.users.companies / metrics.users.total) * 100).toFixed(1)}% of users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.revenue.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${metrics.revenue.thisMonth.toFixed(2)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.revenue.creditsUsed.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${metrics.revenue.creditsThisMonth.toFixed(2)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.features.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              Available positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>How users are engaging with AI features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Resume Enhancements</span>
              <Badge variant="secondary">{metrics.features.resumeEnhancements}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Job Matches</span>
              <Badge variant="secondary">{metrics.features.jobMatches}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Targets</CardTitle>
            <CardDescription>Monthly goals and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Users Goal (1,000)</span>
                <span>{metrics.users.total}/1,000</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${Math.min((metrics.users.total / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Revenue Goal ($500)</span>
                <span>${metrics.revenue.total.toFixed(0)}/$500</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${Math.min((metrics.revenue.total / 500) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Action Items</CardTitle>
          <CardDescription>Key areas to focus on for growth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">User Acquisition</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Set up Google Analytics tracking</li>
                <li>• Create content marketing strategy</li>
                <li>• Launch referral program</li>
                <li>• Optimize SEO for job search keywords</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Revenue Growth</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Implement subscription plans</li>
                <li>• Add premium features</li>
                <li>• Optimize credit pricing</li>
                <li>• Create enterprise packages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
