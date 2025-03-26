import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { NotificationSummary } from "@/components/company/NotificationSummary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

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

  // Get recent notifications
  const notifications = await prisma.companyNotification.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <NotificationSummary companyId={company.id} />
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-muted-foreground">No notifications yet.</p>
              ) : (
                <ul className="space-y-4">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="border-b pb-3 last:border-0">
                      <p className={notification.read ? "text-muted-foreground" : "font-medium"}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

