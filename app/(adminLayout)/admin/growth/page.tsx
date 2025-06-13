import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  CreditCard,
  UserPlus,
  Activity,
  Mail,
  BookOpen,
  Eye,
  MessageSquare,
  Zap,
  ArrowUp,
  ArrowDown
} from "lucide-react"

async function getGrowthMetrics() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  yesterdayStart.setHours(0, 0, 0, 0)
  const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000)

  // User metrics
  const [
    totalUsers,
    newUsersThisMonth,
    newUsersThisWeek,
    newUsersYesterday,
    totalJobSeekers,
    totalCompanies,
    usersLastMonth
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: yesterdayStart, lt: yesterdayEnd } } }),
    prisma.user.count({ where: { userType: "JOB_SEEKER" } }),
    prisma.user.count({ where: { userType: "COMPANY" } }),
    prisma.user.count({ where: { createdAt: { lt: thirtyDaysAgo } } })
  ])

  // Revenue metrics
  const [
    totalCreditsUsed,
    creditsUsedThisMonth,
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth
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
    }),
    prisma.aIUsageLog.aggregate({
      where: {
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      },
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

  // Blog and newsletter data (will be available after migration)
  let totalBlogPosts = 0
  let blogViews = 0
  let newsletterSubscribers = 0

  try {
    // @ts-ignore - These will be available after migration
    totalBlogPosts = await prisma.blogPost?.count({ where: { published: true } }) || 0
    const blogViewsResult = await prisma.blogPost?.aggregate({
      where: { published: true },
      _sum: { views: true }
    })
    blogViews = blogViewsResult?._sum?.views || 0
    newsletterSubscribers = await prisma.newsletterSubscription?.count({ where: { status: "ACTIVE" } }) || 0
  } catch (error) {
    // Models not yet migrated
    console.log("Blog/Newsletter models not yet migrated")
  }

  // Calculate growth rates
  const userGrowthRate = usersLastMonth > 0 ? ((newUsersThisMonth / usersLastMonth) * 100) : 0
  const weeklyGrowthRate = totalUsers > 0 ? (newUsersThisWeek / totalUsers) * 100 : 0
  const revenueGrowthRate = (revenueLastMonth._sum.cost || 0) > 0 ?
    (((revenueThisMonth._sum.cost || 0) - (revenueLastMonth._sum.cost || 0)) / (revenueLastMonth._sum.cost || 0)) * 100 : 0

  return {
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
      newThisWeek: newUsersThisWeek,
      newYesterday: newUsersYesterday,
      jobSeekers: totalJobSeekers,
      companies: totalCompanies,
      growthRate: userGrowthRate,
      weeklyGrowthRate: weeklyGrowthRate
    },
    revenue: {
      total: totalRevenue._sum.cost || 0,
      thisMonth: revenueThisMonth._sum.cost || 0,
      lastMonth: revenueLastMonth._sum.cost || 0,
      creditsUsed: totalCreditsUsed._sum.cost || 0,
      creditsThisMonth: creditsUsedThisMonth._sum.cost || 0,
      growthRate: revenueGrowthRate
    },
    features: {
      resumeEnhancements,
      jobMatches,
      activeJobs,
      blogPosts: totalBlogPosts,
      blogViews: blogViews,
      newsletterSubscribers
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Growth Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Track key metrics and growth indicators for DomiJob
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4 mr-1" />
              Live Data
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Users</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{metrics.users.total.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">+{metrics.users.newThisMonth} this month</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {metrics.users.newYesterday} new yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Monthly Growth</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {metrics.users.growthRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">{metrics.users.weeklyGrowthRate.toFixed(1)}% this week</span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                User acquisition rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Job Seekers</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{metrics.users.jobSeekers.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1.5">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{ width: `${(metrics.users.jobSeekers / metrics.users.total) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                {((metrics.users.jobSeekers / metrics.users.total) * 100).toFixed(1)}% of total users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Companies</CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{metrics.users.companies.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-1.5">
                  <div
                    className="bg-amber-600 h-1.5 rounded-full"
                    style={{ width: `${(metrics.users.companies / metrics.users.total) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {((metrics.users.companies / metrics.users.total) * 100).toFixed(1)}% of total users
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
    </div>
  )
}
