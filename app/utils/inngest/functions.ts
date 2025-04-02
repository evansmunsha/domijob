import { inngest } from "./client"
import { prisma } from "../db"
import { Resend } from "resend"
import { Prisma } from "@prisma/client"
import { logger } from "../logger"

const resend = new Resend(process.env.RESEND_API_KEY)

interface JobExpirationEvent {
  data: {
    jobId: string
    expirationDays: number
  }
}

interface JobseekerCreatedEvent {
  data: {
    userId: string
    email: string
  }
}

// Define types for step functions
interface InngestStep {
  sleep: (id: string, duration: string) => Promise<void>
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>
}

// Define job company interface
interface JobCompany {
  logo: string | null
  name: string
}

// Define job interface
interface Job {
  id: string
  jobTitle: string
  company: JobCompany
  location: string
  salaryFrom: { toLocaleString: () => string }
  salaryTo: { toLocaleString: () => string }
  employmentType: string
}

// Define resource interface
interface LearningResource {
  id: string
  title: string
  url: string
  type: string
}

// Define missing skill interface
interface MissingSkill {
  name: string
  description: string
  demandLevel: string
  learningResources: LearningResource[]
}

export const handleJobExpiration = inngest.createFunction(
  {
    id: "job-expiration",
    cancelOn: [
      {
        event: "job/cancel.expiration",
        if: "event.data.jobId == async.data.jobId",
      },
    ],
  },
  { event: "job/created" },
  async ({ event, step }: { event: JobExpirationEvent; step: InngestStep }) => {
    // Log the incoming event data
    console.log("Received event:", event)

    const { jobId, expirationDays } = event.data

    // Wait for the specified duration
    await step.sleep("wait-for-expiration", `${expirationDays}d`)

    // Update job status to expired
    await step.run("update-job-status", async () => {
      await prisma.jobPost.update({
        where: { id: jobId },
        data: { status: "EXPIRED" },
      })
    })

    return { jobId, message: "Job marked as expired" }
  },
)

export const sendPeriodicJobListing = inngest.createFunction(
  { id: "send-job-listing" },
  { event: "jobseeker/created" },
  async ({ event, step }: { event: JobseekerCreatedEvent; step: InngestStep }) => {
    const { userId, email } = event.data
    const baseUrl = process.env.NEXT_PUBLIC_URL // Base URL for local development

    const totalDays = 30 // Total number of days to send job listings
    const intervalDays = 2 // Interval between job listings (every 2 days)

    for (let currentDay = 0; currentDay < totalDays; currentDay += intervalDays) {
      await step.sleep("wait-interval", `${intervalDays}d`)

      const recentJobs = await step.run("fetch-recent-jobs", async () => {
        return await prisma.jobPost.findMany({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            company: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        })
      })

      if (recentJobs.length > 0) {
        await step.run("send-email", async () => {
          const jobListingsHtml = recentJobs
            .map(
              (job: Job) => `
            <div style="margin-bottom: 20px; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="60" valign="top">
                    <img src="${job.company.logo || `${baseUrl}/placeholder-logo.png`}" alt="${job.company.name} logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                  </td>
                  <td style="padding-left: 15px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #333;">
                      <a href="${baseUrl}/job/${job.id}" style="color: #0066cc; text-decoration: none;">${job.jobTitle}</a>
                    </h3>
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">${job.company.name} - ${job.location}</p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #888;">
                      $${job.salaryFrom.toLocaleString()} - $${job.salaryTo.toLocaleString()} | ${job.employmentType}
                    </p>
                    <a href="${baseUrl}/job/${job.id}" style="background-color: #0066cc; color: #ffffff; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-size: 14px;">View Job</a>
                  </td>
                </tr>
              </table>
            </div>
          `,
            )
            .join("")

          try {
            await resend.emails.send({
              from: "MiJob <onboarding@resend.dev>",
              to: [email],
              subject: "New Job Opportunities Just For You",
              html: `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Job Listings</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                  <div style="background-color: #0066cc; color: #ffffff; text-align: center; padding: 20px;">
                    <h1 style="margin: 0;">Latest Job Opportunities</h1>
                  </div>
                  <div style="padding: 20px;">
                    ${jobListingsHtml}
                    <p style="text-align: center; font-size: 14px; color: #888; margin-top: 30px;">
                      Find your next career move with MiJob!
                    </p>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="${baseUrl}" style="background-color: #0066cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">Explore More Jobs</a>
                    </div>
                  </div>
                  <div style="background-color: #f0f0f0; text-align: center; padding: 10px; font-size: 12px; color: #666;">
                    <p>You're receiving this email because you signed up for job alerts. <a href="${baseUrl}/unsubscribe?user=${userId}" style="color: #0066cc;">Unsubscribe</a></p>
                  </div>
                </div>
              </body>
              </html>
              `,
            })
            console.log(`Email sent successfully to ${email}`)
          } catch (error) {
            console.error(`Failed to send email to ${email}:`, error)
          }
        })
      } else {
        console.log(`No active job listings found for user ${userId}`)
      }
    }

    return { userId, email, message: "Completed 30 day job listing notifications" }
  },
)

const baseUrl = process.env.NEXT_PUBLIC_URL

// Run this function daily to check for new job matches
export const sendPersonalizedJobAlerts = inngest.createFunction(
  { id: "send-personalized-job-alerts" },
  { cron: "0 9 * * *" }, // Run at 9 AM every day
  async ({ step }: { step: InngestStep }) => {
    // Get all job seekers
    const jobSeekers = await step.run("fetch-job-seekers", async () => {
      return await prisma.jobSeeker.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      })
    })

    // Process each job seeker
    const results = await Promise.all(
      jobSeekers.map(async (jobSeeker) => {
        // Skip if no email
        if (!jobSeeker.user.email) {
          return { userId: jobSeeker.userId, status: "skipped", reason: "no email" }
        }

        // Get user's application history to understand preferences
        const [userApplications, savedJobs] = await Promise.all([
          step.run(`fetch-applications-${jobSeeker.userId}`, async () => {
            return await prisma.jobApplication.findMany({
              where: { userId: jobSeeker.userId },
              include: {
                job: {
                  select: {
                    employmentType: true,
                    location: true,
                    jobTitle: true,
                  },
                },
              },
            })
          }),
          step.run(`fetch-saved-jobs-${jobSeeker.userId}`, async () => {
            return await prisma.savedJobPost.findMany({
              where: { userId: jobSeeker.userId },
              include: {
                job: {
                  select: {
                    employmentType: true,
                    location: true,
                    jobTitle: true,
                  },
                },
              },
            })
          }),
        ])

        // Extract preferences
        const employmentTypes = new Set<string>()
        const locations = new Set<string>()
        const titleKeywords = new Set<string>()
        const skills = new Set(jobSeeker.skills || [])

        // Process applied jobs
        userApplications.forEach((app) => {
          if (app.job?.employmentType) {
            employmentTypes.add(app.job.employmentType)
          }
          if (app.job?.location) {
            locations.add(app.job.location)
          }
          if (app.job?.jobTitle) {
            // Extract keywords from job title
            app.job.jobTitle.split(/\s+/).forEach((word) => {
              if (word.length > 3) titleKeywords.add(word.toLowerCase())
            })
          }
        })

        // Process saved jobs
        savedJobs.forEach((saved) => {
          if (saved.job?.employmentType) {
            employmentTypes.add(saved.job.employmentType)
          }
          if (saved.job?.location) {
            locations.add(saved.job.location)
          }
          if (saved.job?.jobTitle) {
            // Extract keywords from job title
            saved.job.jobTitle.split(/\s+/).forEach((word) => {
              if (word.length > 3) titleKeywords.add(word.toLowerCase())
            })
          }
        })

        // Find new matching jobs posted in the last 24 hours
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)

        const matchingJobs = await step.run(`find-matching-jobs-${jobSeeker.userId}`, async () => {
          // Build the query conditions
          const conditions: Prisma.JobPostWhereInput[] = []

          if (employmentTypes.size > 0) {
            conditions.push({
              employmentType: { in: Array.from(employmentTypes) },
            })
          }

          if (locations.size > 0) {
            conditions.push({
              location: { in: Array.from(locations) },
            })
          }

          if (titleKeywords.size > 0) {
            titleKeywords.forEach((keyword) => {
              conditions.push({
                jobTitle: { contains: keyword, mode: Prisma.QueryMode.insensitive },
              })
            })
          }

          if (skills.size > 0) {
            // This is a simplified approach - in a real app, you'd need more sophisticated skill matching
            skills.forEach((skill) => {
              conditions.push({
                jobDescription: { contains: skill, mode: Prisma.QueryMode.insensitive },
              })
            })
          }

          // If we have no conditions, use a basic recency filter
          const whereClause: Prisma.JobPostWhereInput =
            conditions.length > 0
              ? {
                  createdAt: { gte: oneDayAgo },
                  status: "ACTIVE",
                  OR: conditions,
                }
              : {
                  createdAt: { gte: oneDayAgo },
                  status: "ACTIVE",
                }

          return await prisma.jobPost.findMany({
            where: whereClause,
            include: {
              company: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5, // Limit to 5 jobs per alert
          })
        })

        // If we found matching jobs, send an alert
        if (matchingJobs.length > 0) {
          // Create notification records for companies
          await step.run(`create-company-notifications-${jobSeeker.userId}`, async () => {
            for (const job of matchingJobs) {
              await prisma.companyNotification.create({
                data: {
                  companyId: job.companyId,
                  jobId: job.id,
                  type: "NEW_JOB_MATCH",
                  message: `New job match: ${job.jobTitle} at ${job.company.name}`,
                  read: false,
                },
              })
            }
          })

          // Create in-app notifications for the job seeker
          await step.run(`create-user-notifications-${jobSeeker.userId}`, async () => {
            for (const job of matchingJobs) {
              await prisma.userNotification.create({
                data: {
                  userId: jobSeeker.userId,
                  jobId: job.id,
                  type: "NEW_JOB_MATCH",
                  message: `New job match: ${job.jobTitle} at ${job.company.name}`,
                  read: false,
                },
              })
            }
          })

          // Send email alert
          await step.run(`send-email-${jobSeeker.userId}`, async () => {
            const jobListingsHtml = matchingJobs
              .map(
                (job) => `
              <div style="margin-bottom: 20px; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="60" valign="top">
                      <img src="${job.company.logo || `${baseUrl}/placeholder-logo.png`}" alt="${job.company.name} logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                    </td>
                    <td style="padding-left: 15px;">
                      <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #333;">
                        <a href="${baseUrl}/jobs/${job.id}" style="color: #0066cc; text-decoration: none;">${job.jobTitle}</a>
                      </h3>
                      <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">${job.company.name} - ${job.location}</p>
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #888;">
                        $${job.salaryFrom.toLocaleString()} - $${job.salaryTo.toLocaleString()} | ${job.employmentType}
                      </p>
                      <a href="${baseUrl}/jobs/${job.id}" style="background-color: #0066cc; color: #ffffff; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-size: 14px;">View Job</a>
                    </td>
                  </tr>
                </table>
              </div>
            `,
              )
              .join("")

            try {
              await resend.emails.send({
                from: "MiJob <onboarding@resend.dev>",
                to: [jobSeeker.user.email],
                subject: "Personalized Job Matches Just For You",
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Personalized Job Matches</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0;">
                  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="background-color: #0066cc; color: #ffffff; text-align: center; padding: 20px;">
                      <h1 style="margin: 0;">Jobs Matched to Your Profile</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Hello ${jobSeeker.name},</p>
                      <p>We've found ${matchingJobs.length} new job${matchingJobs.length > 1 ? "s" : ""} that match your profile and preferences:</p>
                      ${jobListingsHtml}
                      <p style="text-align: center; font-size: 14px; color: #888; margin-top: 30px;">
                        These matches are based on your skills and application history.
                      </p>
                      <div style="text-align: center; margin-top: 20px;">
                        <a href="${baseUrl}/dashboard" style="background-color: #0066cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">View More Recommendations</a>
                      </div>
                    </div>
                    <div style="background-color: #f0f0f0; text-align: center; padding: 10px; font-size: 12px; color: #666;">
                      <p>You're receiving this email because you signed up for job alerts. <a href="${baseUrl}/settings/notifications" style="color: #0066cc;">Manage Notifications</a></p>
                    </div>
                  </div>
                </body>
                </html>
                `,
              })
              return { success: true }
            } catch (error) {
              console.error(`Failed to send email to ${jobSeeker.user.email}:`, error)
              return { success: false, error }
            }
          })

          return {
            userId: jobSeeker.userId,
            status: "sent",
            matchCount: matchingJobs.length,
          }
        }

        return {
          userId: jobSeeker.userId,
          status: "no_matches",
        }
      }),
    )

    return {
      processed: jobSeekers.length,
      results,
    }
  },
)

// This function runs when a new job is posted to find matching candidates
export const handleJobCreated = inngest.createFunction(
  { id: "handle-job-created" },
  { event: "job/created" },
  async ({ event, step }: { event: { data: { jobId: string; companyId: string } }; step: InngestStep }) => {
    const { jobId, companyId } = event.data

    logger.info(`Processing job/created event for job: ${jobId}, company: ${companyId}`)

    // Get the job details
    const job = await step.run("fetch-job", async () => {
      logger.debug(`Fetching job details for job: ${jobId}`)
      return await prisma.jobPost.findUnique({
        where: { id: jobId },
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
      })
    })

    if (!job) {
      logger.error(`Job not found: ${jobId}`, new Error("Job not found"))
      return { error: "Job not found" }
    }

    logger.info(`Found job: ${job.jobTitle}`)

    // Find job seekers with matching skills or preferences
    const matchingJobSeekers = await step.run("find-matching-candidates", async () => {
      // Extract keywords from job title and description
      const jobText = `${job.jobTitle} ${job.jobDescription}`.toLowerCase()
      const keywords = extractKeywords(jobText)

      logger.debug(`Extracted keywords for job ${jobId}:`, keywords)

      // Find job seekers with matching skills
      const jobSeekers = await prisma.jobSeeker.findMany({
        where: {
          OR: [
            // Match by skills
            {
              skills: {
                hasSome: keywords,
              },
            },
            // Match by location
            {
              user: {
                JobApplication: {
                  some: {
                    job: {
                      location: job.location,
                    },
                  },
                },
              },
            },
            // Match by employment type
            {
              user: {
                JobApplication: {
                  some: {
                    job: {
                      employmentType: job.employmentType,
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        take: 50, // Limit to 50 candidates
      })

      logger.info(`Found ${jobSeekers.length} matching job seekers for job ${jobId}`)
      return jobSeekers
    })

    // Create notifications for matching job seekers
    const notificationResults = await step.run("create-notifications", async () => {
      const results = []

      logger.info(`Creating notifications for ${matchingJobSeekers.length} job seekers`)

      for (const jobSeeker of matchingJobSeekers) {
        // Create in-app notification
        try {
          logger.debug(`Creating notification for user ${jobSeeker.userId}`)

          const notification = await prisma.userNotification.create({
            data: {
              userId: jobSeeker.userId,
              jobId: job.id,
              type: "NEW_JOB_MATCH",
              message: `New job match: ${job.jobTitle} at ${job.company.name}`,
              read: false,
            },
          })

          logger.notification("NEW_JOB_MATCH", jobSeeker.userId, `Created notification: ${notification.id}`)

          results.push({
            userId: jobSeeker.userId,
            status: "success",
            notificationId: notification.id,
          })
        } catch (error) {
          logger.error(`Failed to create notification for user ${jobSeeker.userId}:`, error)
          results.push({
            userId: jobSeeker.userId,
            status: "error",
            error,
          })
        }
      }

      return results
    })

    return {
      jobId,
      matchCount: matchingJobSeekers.length,
      notificationResults,
    }
  },
)

// Helper function to extract keywords from text
function extractKeywords(text: string): string[] {
  // This is a simplified implementation
  // In a real app, you'd use NLP or a more sophisticated approach
  const words = text.split(/\s+/)
  const keywords = new Set<string>()

  for (const word of words) {
    // Only include words longer than 3 characters
    if (word.length > 3) {
      keywords.add(word.toLowerCase())
    }
  }

  return Array.from(keywords)
}

interface SkillGapEvent {
  data: {
    userId: string
    targetJobTitle: string
  }
}

// Common tech skills with descriptions
const skillDatabase = {
  javascript: {
    name: "JavaScript",
    description: "Core programming language for web development, essential for frontend and increasingly for backend.",
    demandLevel: "high",
    resources: [
      {
        id: "1",
        title: "MDN JavaScript Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        type: "Documentation",
      },
      { id: "2", title: "JavaScript.info", url: "https://javascript.info/", type: "Tutorial" },
    ],
  },
  typescript: {
    name: "TypeScript",
    description: "Strongly typed programming language that builds on JavaScript, adding static type definitions.",
    demandLevel: "high",
    resources: [
      {
        id: "1",
        title: "TypeScript Handbook",
        url: "https://www.typescriptlang.org/docs/handbook/intro.html",
        type: "Documentation",
      },
      { id: "2", title: "TypeScript Deep Dive", url: "https://basarat.gitbook.io/typescript/", type: "Book" },
    ],
  },
  react: {
    name: "React",
    description: "JavaScript library for building user interfaces, particularly single-page applications.",
    demandLevel: "high",
    resources: [
      {
        id: "1",
        title: "React Documentation",
        url: "https://reactjs.org/docs/getting-started.html",
        type: "Documentation",
      },
      { id: "2", title: "React Tutorial", url: "https://react.dev/learn", type: "Tutorial" },
    ],
  },
  nextjs: {
    name: "Next.js",
    description: "React framework that enables server-side rendering and generating static websites.",
    demandLevel: "high",
    resources: [
      { id: "1", title: "Next.js Documentation", url: "https://nextjs.org/docs", type: "Documentation" },
      { id: "2", title: "Learn Next.js", url: "https://nextjs.org/learn", type: "Tutorial" },
    ],
  },
  // More skills would be defined here...
}

// Job title to required skills mapping
const jobSkillsMap: Record<string, string[]> = {
  "frontend developer": ["html", "css", "javascript", "react"],
  "senior frontend developer": ["html", "css", "javascript", "typescript", "react", "redux", "jest"],
  "react developer": ["javascript", "react", "html", "css"],
  "senior react developer": ["javascript", "typescript", "react", "redux", "jest", "nextjs"],
  "full stack developer": ["javascript", "html", "css", "node", "express", "sql"],
  "senior full stack developer": ["javascript", "typescript", "react", "node", "express", "sql", "mongodb", "docker"],
  // More job titles would be defined here...
}

export const analyzeSkillGap = inngest.createFunction(
  { id: "analyze-skill-gap" },
  { event: "user/request.skill-gap-analysis" },
  async ({ event, step }: { event: SkillGapEvent; step: InngestStep }) => {
    const { userId, targetJobTitle } = event.data

    // Get user's current skills
    const jobSeeker = await step.run("fetch-user-skills", async () => {
      return await prisma.jobSeeker.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      })
    })

    if (!jobSeeker) {
      return { error: "User profile not found" }
    }

    const userSkills = jobSeeker.skills || []
    const normalizedUserSkills = userSkills.map((skill: string) => skill.toLowerCase())

    // Find the closest job title match
    const normalizedTargetJob = targetJobTitle.toLowerCase()
    let requiredSkills: string[] = []

    // Try to find an exact match first
    if (normalizedTargetJob in jobSkillsMap) {
      requiredSkills = jobSkillsMap[normalizedTargetJob]
    } else {
      // If no exact match, find the closest match
      const jobTitles = Object.keys(jobSkillsMap)
      const closestMatch = jobTitles.find(
        (title: string) => normalizedTargetJob.includes(title) || title.includes(normalizedTargetJob),
      )

      if (closestMatch) {
        requiredSkills = jobSkillsMap[closestMatch]
      } else {
        // If still no match, use a default set of skills
        requiredSkills = ["html", "css", "javascript", "react"]
      }
    }

    // Identify missing skills
    const missingSkillIds = requiredSkills.filter(
      (skill: string) =>
        !normalizedUserSkills.some((userSkill: string) => userSkill.includes(skill) || skill.includes(userSkill)),
    )

    // Get detailed information for missing skills
    const missingSkills = missingSkillIds.map((skillId: string) => ({
      name: skillDatabase[skillId as keyof typeof skillDatabase]?.name || skillId,
      description: skillDatabase[skillId as keyof typeof skillDatabase]?.description || "No description available",
      demandLevel: skillDatabase[skillId as keyof typeof skillDatabase]?.demandLevel || "medium",
      learningResources: skillDatabase[skillId as keyof typeof skillDatabase]?.resources || [],
    }))

    // Calculate completeness percentage
    const completeness = Math.round((userSkills.length / (userSkills.length + missingSkills.length)) * 100)

    // Store the analysis results
    await step.run("store-analysis-results", async () => {
      // You would need to create a table for this in your schema
      // This is just a placeholder implementation - comment out if you don't have the table yet
      /**/
      await prisma.skillGapAnalysis.create({
        data: {
          userId,
          targetJobTitle,
          currentSkills: userSkills,
          //@ts-expect-error - Type mismatch between generated missingSkills and MissingSkill[] interface
          missingSkills: missingSkills as MissingSkill[],
          completeness,
        },
      })

      console.log("Storing analysis results:", {
        userId,
        targetJobTitle,
        currentSkills: userSkills,
        missingSkills,
        completeness,
      })
    })

    // Create in-app notification for the user
    await step.run("create-user-notification", async () => {
      await prisma.userNotification.create({
        data: {
          userId,
          type: "SKILL_GAP_ANALYSIS",
          message: `Your skill gap analysis for ${targetJobTitle} is ready. You have ${completeness}% of the required skills.`,
          read: false,
        },
      })
    })

    // Send email with results if user has email
    if (jobSeeker.user.email) {
      await step.run("send-analysis-email", async () => {
        const missingSkillsHtml = missingSkills
          .map(
            (skill) => `
          <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
            <h3 style="margin-top: 0;">${skill.name}</h3>
            <p style="margin-bottom: 5px;">${skill.description}</p>
            <span style="display: inline-block; padding: 3px 8px; background-color: ${
              skill.demandLevel === "high" ? "#d1fae5" : skill.demandLevel === "medium" ? "#fef3c7" : "#dbeafe"
            }; color: ${
              skill.demandLevel === "high" ? "#065f46" : skill.demandLevel === "medium" ? "#92400e" : "#1e40af"
            }; border-radius: 12px; font-size: 12px; margin-bottom: 10px;">${skill.demandLevel} demand</span>
            
            ${
              skill.learningResources.length > 0
                ? `
              <p style="margin-top: 10px; font-weight: bold;">Learning Resources:</p>
              <ul style="padding-left: 20px;">
                ${skill.learningResources
                  .map(
                    (resource) => `
                  <li><a href="${resource.url}" style="color: #0066cc;">${resource.title}</a> (${resource.type})</li>
                `,
                  )
                  .join("")}
              </ul>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")

        try {
          await resend.emails.send({
            from: "MiJob <onboarding@resend.dev>",
            to: [jobSeeker.user.email],
            subject: `Your Skill Gap Analysis for ${targetJobTitle}`,
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Skill Gap Analysis</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #0066cc; color: #ffffff; text-align: center; padding: 20px;">
                  <h1 style="margin: 0;">Your Skill Gap Analysis</h1>
                </div>
                <div style="padding: 20px;">
                  <p>Hello ${jobSeeker.name},</p>
                  <p>We've analyzed your skills against the requirements for <strong>${targetJobTitle}</strong>. Here's what we found:</p>
                  
                  <div style="margin: 20px 0; text-align: center;">
                    <div style="width: 100%; background-color: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
                      <div style="width: ${completeness}%; background-color: #0066cc; height: 100%;"></div>
                    </div>
                    <p style="margin-top: 5px;">You have ${completeness}% of the recommended skills</p>
                  </div>
                  
                  <h2 style="margin-top: 30px;">Skills to Develop</h2>
                  ${missingSkillsHtml}
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${baseUrl}/profile" style="background-color: #0066cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">Update Your Skills</a>
                  </div>
                </div>
                <div style="background-color: #f0f0f0; text-align: center; padding: 10px; font-size: 12px; color: #666;">
                  <p>You're receiving this email because you requested a skill gap analysis. <a href="${baseUrl}/settings" style="color: #0066cc;">Manage Email Preferences</a></p>
                </div>
              </div>
            </body>
            </html>
            `,
          })
          console.log(`Skill gap analysis email sent to ${jobSeeker.user.email}`)
        } catch (error) {
          console.error(`Failed to send skill gap analysis email:`, error)
        }
      })
    }

    return {
      userId,
      targetJobTitle,
      currentSkillsCount: userSkills.length,
      missingSkillsCount: missingSkills.length,
      completeness,
    }
  },
)

