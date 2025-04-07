import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NotificationSummary } from "@/components/company/NotificationSummary"

async function getCompanyDashboardData(userId: string) {
  const company = await prisma.company.findUnique({
    where: { userId },
    include: {
      JobPost: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: {
            select: { JobApplication: true },
          },
        },
      },
    },
  })

  if (!company) {
    redirect("/onboarding")
  }

  return company
}

export default async function CompanyDashboard() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.userType !== "COMPANY") {
    redirect("/dashboard")
  }

  const company = await getCompanyDashboardData(session.user.id)

  return (
    <div className="container py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Company Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                {company.JobPost.length > 0 ? (
                  <ul className="space-y-2">
                    {company.JobPost.map((job) => (
                      <li key={job.id} className="flex justify-between items-center">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.jobTitle}
                        </Link>
                        <span>{job._count.JobApplication} applicants</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No active job postings.</p>
                )}
                <Button asChild className="mt-4">
                  <Link href="/post-job">Post a New Job</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/company-profile">Edit Company Profile</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/my-jobs">Manage Job Postings</Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/company/analytics">View Analytics</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/company/potential-candidates">Potential Candidates</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add the NotificationSummary component here with error handling */}
        <div>
          {company.id ? (
            <NotificationSummary companyId={company.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Unable to load notifications</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

