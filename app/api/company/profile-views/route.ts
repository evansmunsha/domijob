import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { logger } from "@/app/utils/logger"
import { startOfDay, startOfWeek, startOfMonth } from "date-fns"

// Calculate match percentage between job seeker skills and job requirements
function calculateMatchScore(jobSeekerSkills: string[], jobText: string): number {
  if (!jobSeekerSkills.length) return 0

  let matchCount = 0
  jobSeekerSkills.forEach((skill) => {
    if (jobText.toLowerCase().includes(skill.toLowerCase())) {
      matchCount++
    }
  })

  return Math.round((matchCount / jobSeekerSkills.length) * 100)
}

// GET handler for fetching profile views analytics
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get URL parameters
    const url = new URL(req.url)
    const periodParam = url.searchParams.get("period") || "week"
    const companyId = url.searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Verify the user has access to this company's data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        Company: true,
      },
    })

    // Only allow access if the user is associated with the company
    if (user?.Company?.id !== companyId) {
      return NextResponse.json({ error: "Unauthorized to access this company's data" }, { status: 403 })
    }

    // Determine date range based on period
    const now = new Date()
    let startDate: Date

    switch (periodParam) {
      case "day":
        startDate = startOfDay(now)
        break
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 }) // Start on Monday
        break
      case "month":
        startDate = startOfMonth(now)
        break
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 })
    }

    logger.debug(`Fetching profile views for company ${companyId} from ${startDate.toISOString()}`)

    // Query profile views for the company within the date range
    const profileViews = await prisma.companyProfileView.findMany({
      where: {
        companyId: companyId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    // Calculate total views
    const totalViews = profileViews.length

    // Process data for chart based on period
    let data: Array<{ label: string; views: number }> = []
    const locationMap = new Map<string, number>()

    if (periodParam === "day") {
      // Group by hour for day view
      const hourlyData = new Map<string, number>()

      // Initialize hours
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, "0")
        hourlyData.set(`${hour}:00`, 0)
      }

      // Count views by hour
      profileViews.forEach((view) => {
        const hour = new Date(view.timestamp).getHours().toString().padStart(2, "0")
        hourlyData.set(`${hour}:00`, (hourlyData.get(`${hour}:00`) || 0) + 1)

        // Track locations
        locationMap.set(view.location, (locationMap.get(view.location) || 0) + 1)
      })

      data = Array.from(hourlyData.entries()).map(([label, views]) => ({ label, views }))
    } else if (periodParam === "week") {
      // Group by day for week view
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      const dailyData = new Map<string, number>()

      // Initialize days
      dayNames.forEach((day) => {
        dailyData.set(day, 0)
      })

      // Count views by day
      profileViews.forEach((view) => {
        const dayIndex = new Date(view.timestamp).getDay()
        // Convert from Sunday=0 to Monday=0 format
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1
        const dayName = dayNames[adjustedIndex]
        dailyData.set(dayName, (dailyData.get(dayName) || 0) + 1)

        // Track locations
        locationMap.set(view.location, (locationMap.get(view.location) || 0) + 1)
      })

      data = Array.from(dailyData.entries()).map(([label, views]) => ({ label, views }))
    } else if (periodParam === "month") {
      // Group by date for month view
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const dailyData = new Map<string, number>()

      // Initialize days
      for (let i = 1; i <= daysInMonth; i++) {
        const date = i.toString().padStart(2, "0")
        dailyData.set(date, 0)
      }

      // Count views by date
      profileViews.forEach((view) => {
        const date = new Date(view.timestamp).getDate().toString().padStart(2, "0")
        dailyData.set(date, (dailyData.get(date) || 0) + 1)

        // Track locations
        locationMap.set(view.location, (locationMap.get(view.location) || 0) + 1)
      })

      data = Array.from(dailyData.entries()).map(([label, views]) => ({ label, views }))
    }

    // Format location data and sort by views (descending)
    const locations = Array.from(locationMap.entries())
      .map(([location, views]) => ({ location, views }))
      .sort((a, b) => b.views - a.views)

    return NextResponse.json({
      data,
      locations,
      period: periodParam,
      totalViews,
    })
  } catch (error) {
    logger.error("Error fetching profile views analytics:", error)
    return NextResponse.json({ error: "Failed to fetch profile views analytics" }, { status: 500 })
  }
}

// POST handler for recording a new profile view
export async function POST(req: Request) {
  try {
    const { companyId } = await req.json()

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Check if the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Get the current user (optional - they might not be logged in)
    const session = await auth()
    const userId = session?.user?.id

    // Get user location from headers if available
    const userLocation = req.headers.get("x-vercel-ip-country") || "Unknown"

    // Check if the viewer is the company owner
    if (userId === company.userId) {
      logger.debug(`Skipping view from company owner ${userId}`)
      return NextResponse.json({ success: true, skipped: true })
    }

    // Check for any views from this user today
    if (userId) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      const existingView = await prisma.companyProfileView.findFirst({
        where: {
          companyId,
          userId,
          timestamp: {
            gte: todayStart,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      })

      if (existingView) {
        logger.debug(`Skipping duplicate view from user ${userId} on same day`, {
          lastViewTime: existingView.timestamp,
        })
        return NextResponse.json({ success: true, skipped: true })
      }
    }

    logger.info(`Recording profile view for company ${companyId}`, {
      userId: userId || "anonymous",
      location: userLocation,
    })

    // Record the profile view
    const profileView = await prisma.companyProfileView.create({
      data: {
        companyId,
        userId: userId || undefined,
        timestamp: new Date(),
        location: userLocation,
      },
    })

    logger.debug(`Profile view recorded: ${profileView.id}`)

    // Create a notification for the company if this is a significant event
    // For example, if this is the 10th view today or if a job seeker with matching skills viewed the profile
    const viewsToday = await prisma.companyProfileView.count({
      where: {
        companyId,
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })

    if (viewsToday === 10 || viewsToday === 50 || viewsToday === 100) {
      const notification = await prisma.companyNotification.create({
        data: {
          companyId,
          type: "PROFILE_VIEWS",
          message: `Your company profile has received ${viewsToday} views today!`,
          read: false,
        },
      })

      logger.notification("PROFILE_VIEWS", companyId, `Created company notification for ${viewsToday} profile views`, {
        notificationId: notification.id,
      })
    }

    // Check for views from new regions
    const existingLocations = await prisma.companyProfileView.groupBy({
      by: ["location"],
      where: {
        companyId,
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _count: {
        _all: true
      }
    })

    const locationCount = existingLocations.find((l) => l.location === userLocation)?._count._all || 0
    const isNewRegion = !existingLocations.find((l) => l.location === userLocation)

    if (userLocation !== "Unknown") {
      if (isNewRegion) {
        // First view from this region today
        const notification = await prisma.companyNotification.create({
          data: {
            companyId,
            type: "NEW_REGION",
            message: `Your profile was viewed from ${userLocation} for the first time!`,
            read: false,
          },
        })

        logger.notification("NEW_REGION", companyId, `Created company notification for new region: ${userLocation}`, {
          notificationId: notification.id,
        })
      } else if (locationCount === 5 || locationCount === 10 || locationCount === 20) {
        // Create milestone notifications for multiple views from the same region
        const notification = await prisma.companyNotification.create({
          data: {
            companyId,
            type: "REGION_MILESTONE",
            message: `Your profile has been viewed ${locationCount} times from ${userLocation} today!`,
            read: false,
          },
        })

        logger.notification("REGION_MILESTONE", companyId, `Created milestone notification for ${locationCount} views from ${userLocation}`, {
          notificationId: notification.id,
        })
      }
    }

    // If the viewer is a job seeker with relevant skills, notify the company
    if (userId) {
      const jobSeeker = await prisma.jobSeeker.findUnique({
        where: { userId },
        select: { skills: true, name: true },
      })

      if (jobSeeker && jobSeeker.skills && jobSeeker.skills.length > 0) {
        // Check if this job seeker has skills that match the company's job requirements
        const companyJobs = await prisma.jobPost.findMany({
          where: {
            companyId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            jobTitle: true,
            jobDescription: true,
          },
        })

        const jobTexts = companyJobs
          .map((job) => `${job.jobTitle} ${job.jobDescription}`)
          .join(" ")
          .toLowerCase()

        // Calculate match score
        const matchScore = calculateMatchScore(jobSeeker.skills, jobTexts)

        // Find the best matching job
        let bestMatchingJob = null
        let highestScore = 0

        for (const job of companyJobs) {
          const jobText = `${job.jobTitle} ${job.jobDescription}`.toLowerCase()
          const score = calculateMatchScore(jobSeeker.skills, jobText)

          if (score > highestScore) {
            highestScore = score
            bestMatchingJob = job
          }
        }

        logger.debug(`Job seeker ${userId} has a ${matchScore}% match with company ${companyId}`)

        if (matchScore > 50) {
          const notification = await prisma.companyNotification.create({
            data: {
              companyId,
              jobId: bestMatchingJob?.id,
              type: "POTENTIAL_CANDIDATE",
              message: `A job seeker with ${matchScore}% skill match viewed your profile`,
              read: false,
              metadata: JSON.stringify({
                skills: jobSeeker.skills,
                matchScore,
                viewerName: jobSeeker.name || "Anonymous",
              }),
            },
          })

          logger.notification(
            "POTENTIAL_CANDIDATE",
            companyId,
            `Created company notification for potential candidate with ${matchScore}% match`,
            {
              notificationId: notification.id,
              jobSeekerId: userId,
              matchScore,
            },
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error recording profile view:", error)
    return NextResponse.json({ error: "Failed to record profile view" }, { status: 500 })
  }
}

