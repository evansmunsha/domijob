//app/(adminLayout)/admin/page.tsx


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/app/utils/db"

export const metadata = {
  title: "Admin Dashboard | MiJob",
  description: "Admin dashboard for MiJob platform",
}

async function getStats() {
  const [
    userCount,
    jobCount,
    companyCount,
    affiliateCount,
    pendingPayments
  ] = await Promise.all([
    prisma.user.count(),
    prisma.jobPost.count(),
    prisma.company.count(),
    prisma.affiliate.count(),
    prisma.affiliatePayment.count({
      where: { status: "PENDING" }
    })
  ])
  
  return {
    userCount,
    jobCount,
    companyCount,
    affiliateCount,
    pendingPayments
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your platform and users</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companyCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.affiliateCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a 
              href="/admin/affiliate/payments" 
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-semibold mb-1">Pending Payments</h3>
              <p className="text-sm text-muted-foreground">
                {stats.pendingPayments} payment{stats.pendingPayments !== 1 ? 's' : ''} awaiting approval
              </p>
            </a>
            
            <a 
              href="/admin/jobs" 
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-semibold mb-1">Manage Jobs</h3>
              <p className="text-sm text-muted-foreground">
                Review and manage job postings
              </p>
            </a>
            
            <a 
              href="/admin/users" 
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-semibold mb-1">User Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage users and permissions
              </p>
            </a>

            <a 
              href="/admin/comments" 
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-semibold mb-1">Comment Management</h3>
              <p className="text-sm text-muted-foreground">
                Review and approve blog comments
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}