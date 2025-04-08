import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { NotificationSummary } from "@/components/company/NotificationSummary"
import { NotificationList } from "@/components/company/NotificationList"

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <NotificationSummary companyId={company.id} />
        </div>

        <div className="md:col-span-2">
          <NotificationList 
            initialNotifications={notifications}
            companyId={company.id}
          />
        </div>
      </div>
    </div>
  )
}

