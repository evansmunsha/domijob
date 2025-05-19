import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { logger } from "@/app/utils/logger"

// This endpoint should be called by a scheduled job (e.g., Vercel Cron)
export async function GET(req: Request) {
  // Verify this is called by a cron job or authorized source
    // app/api/notifications/cleanup/route.ts
  try {
    // Verify this is called by a cron job or authorized source
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    // Rest of your cleanup logic...

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Archive old read notifications (move to archive table or delete)
    const [oldUserNotifications, oldCompanyNotifications] = await Promise.all([
      // Delete old read user notifications
      prisma.userNotification.deleteMany({
        where: {
          read: true,
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),

      // Delete old read company notifications
      prisma.companyNotification.deleteMany({
        where: {
          read: true,
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),
    ])

    logger.info(`Cleaned up old notifications`, {
      userNotificationsDeleted: oldUserNotifications.count,
      companyNotificationsDeleted: oldCompanyNotifications.count,
    })

    return NextResponse.json({
      success: true,
      userNotificationsDeleted: oldUserNotifications.count,
      companyNotificationsDeleted: oldCompanyNotifications.count,
    })
  } catch (error) {
    logger.error("Error cleaning up notifications:", error)
    return NextResponse.json({ error: "Failed to clean up notifications" }, { status: 500 })
  }
}

