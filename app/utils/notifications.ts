import { prisma } from "./db"
import { logger } from "./logger"

/**
 * Creates a notification for a company about a new application
 */
export async function notifyCompanyOfNewApplication(
  companyId: string,
  jobId: string,
  jobTitle: string,
  applicantName: string,
): Promise<void> {
  try {
    // Create a notification for the company
    const notification = await prisma.companyNotification.create({
      data: {
        companyId,
        jobId,
        type: "NEW_APPLICATION",
        message: `New application received from ${applicantName} for ${jobTitle}`,
        read: false,
      },
    })

    logger.notification(
      "NEW_APPLICATION",
      companyId,
      `Created company notification for new application to job ${jobId}`,
      {
        notificationId: notification.id,
        jobTitle,
        applicantName,
      },
    )
  } catch (error) {
    logger.error("Failed to create company notification:", error)
    // Log but don't throw - we don't want to fail the application if notification fails
  }
}

/**
 * Creates a notification for a user about a job match
 */
export async function notifyUserOfJobMatch(
  userId: string,
  jobId: string,
  jobTitle: string,
  companyName: string,
): Promise<void> {
  try {
    const notification = await prisma.userNotification.create({
      data: {
        userId,
        jobId,
        type: "NEW_JOB_MATCH",
        message: `New job match: ${jobTitle} at ${companyName}`,
        read: false,
      },
    })

    logger.notification("NEW_JOB_MATCH", userId, `Created user notification for job match: ${jobTitle}`, {
      notificationId: notification.id,
      jobId,
      companyName,
    })
  } catch (error) {
    logger.error("Failed to create user notification for job match:", error)
  }
}

/**
 * Creates a notification for a user about an application status change
 */
export async function notifyUserOfApplicationStatusChange(
  userId: string,
  jobId: string,
  jobTitle: string,
  status: string,
): Promise<void> {
  try {
    const notification = await prisma.userNotification.create({
      data: {
        userId,
        jobId,
        type: "APPLICATION_STATUS_CHANGE",
        message: `Your application for ${jobTitle} is now ${status.toLowerCase()}`,
        read: false,
      },
    })

    logger.notification(
      "APPLICATION_STATUS_CHANGE",
      userId,
      `Created user notification for application status change to ${status}`,
      {
        notificationId: notification.id,
        jobId,
        status,
      },
    )
  } catch (error) {
    logger.error("Failed to create user notification for status change:", error)
  }
}

/**
 * Creates a notification for a company about a profile view
 */
export async function notifyCompanyOfProfileView(
  companyId: string,
  viewCount: number,
  location?: string,
): Promise<void> {
  try {
    // Only notify for significant view counts
    if (viewCount !== 10 && viewCount !== 50 && viewCount !== 100 && viewCount !== 500 && viewCount !== 1000) {
      return
    }

    const notification = await prisma.companyNotification.create({
      data: {
        companyId,
        type: "PROFILE_VIEWS",
        message: `Your company profile has received ${viewCount} views${location ? ` from ${location}` : ""}!`,
        read: false,
      },
    })

    logger.notification("PROFILE_VIEWS", companyId, `Created company notification for ${viewCount} profile views`, {
      notificationId: notification.id,
      viewCount,
      location,
    })
  } catch (error) {
    logger.error("Failed to create company notification for profile views:", error)
  }
}

/**
 * Creates a notification for a company about a potential candidate
 */
export async function notifyCompanyOfPotentialCandidate(
  companyId: string,
  jobId: string | undefined,
  matchScore: number,
  skills: string[],
  viewerName: string,
): Promise<void> {
  try {
    // Only notify for good matches
    if (matchScore < 50) {
      return
    }

    const notification = await prisma.companyNotification.create({
      data: {
        companyId,
        jobId,
        type: "POTENTIAL_CANDIDATE",
        message: `A job seeker with ${matchScore}% skill match viewed your profile`,
        read: false,
        metadata: JSON.stringify({
          skills,
          matchScore,
          viewerName,
        }),
      },
    })

    logger.notification(
      "POTENTIAL_CANDIDATE",
      companyId,
      `Created company notification for potential candidate with ${matchScore}% match`,
      {
        notificationId: notification.id,
        jobId,
        matchScore,
      },
    )
  } catch (error) {
    logger.error("Failed to create company notification for potential candidate:", error)
  }
}












/**import { prisma } from "@/app/utils/db"
import { sendEmail } from "./emailService"


 * Creates a notification for a company when a new job application is submitted
 
export async function notifyCompanyOfNewApplication(
  companyId: string,
  jobId: string,
  jobTitle: string,
  applicantName: string,
) {
  try {
    // Find the company and their email
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, user: { select: { email: true } } },
    })

    if (!company || !company.user.email) {
      console.error(`Company not found or missing email: ${companyId}`)
      return // Return instead of throwing to prevent application failure
    }

    // Try to send the email, but don't let it block the notification creation
    try {
      const subject = `New application for ${jobTitle}`
      const html = `
        <h1>New Job Application</h1>
        <p>Hello ${company.name},</p>
        <p>A new application has been submitted for the position: <strong>${jobTitle}</strong></p>
        <p>Applicant: <strong>${applicantName}</strong></p>
        <p>This application was submitted through MiJob.</p>
        <p>Please <a href="${process.env.NEXT_PUBLIC_URL}/my-jobs/${jobId}/applications">log in to your MiJob dashboard</a> to review the application.</p>
        <p>Best regards,<br>MiJob Team</p>
      `

      await sendEmail(company.user.email, subject, html)
      console.log(`Email notification sent to ${company.user.email} for job application from ${applicantName}`)
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError)
      // Continue with creating the notification even if email fails
    }

    // Create a notification for the company - explicitly set read to false
    const notification = await prisma.companyNotification.create({
      data: {
        companyId,
        jobId,
        type: "NEW_APPLICATION",
        message: `New application received for ${jobTitle} from ${applicantName}`,
        read: false, // Explicitly set this field
      },
    })

    console.log(`Created company notification: ${notification.id} for company: ${companyId}`)
    return notification
  } catch (error) {
    console.error("Error in notifyCompanyOfNewApplication:", error)
    // Log the error but don't throw - we don't want to fail the application if notification fails
  }
}*/

/**
 * Creates a notification for a job seeker when there's an update to their application
 */
export async function notifyJobSeekerOfApplicationUpdate(
  userId: string,
  jobId: string,
  jobTitle: string,
  status: string,
) {
  try {
    const notification = await prisma.userNotification.create({
      data: {
        userId,
        jobId,
        type: "APPLICATION_STATUS_CHANGE",
        message: `Your application for ${jobTitle} is now ${status.toLowerCase()}`,
        read: false,
      },
    })

    console.log(`Created user notification for application status change: ${notification.id}`)
    return notification
  } catch (error) {
    console.error("Error creating application update notification:", error)
    // Log but don't throw
  }
}

/**
 * Creates a notification for a company when a job seeker views their profile
 
export async function notifyCompanyOfProfileView(
  companyId: string,
  viewerName = "A job seeker",
  matchScore?: number,
  jobId?: string,
) {
  try {
    const message = matchScore
      ? `${viewerName} with a ${matchScore}% skill match viewed your profile`
      : `${viewerName} viewed your company profile`

    const notification = await prisma.companyNotification.create({
      data: {
        companyId,
        jobId,
        type: matchScore ? "POTENTIAL_CANDIDATE" : "PROFILE_VIEW",
        message,
        read: false,
        metadata: matchScore ? JSON.stringify({ matchScore, viewerName }) : undefined,
      },
    })

    console.log(`Created company notification for profile view: ${notification.id}`)
    return notification
  } catch (error) {
    console.error("Error creating profile view notification:", error)
    // Log but don't throw
  }
}*/

