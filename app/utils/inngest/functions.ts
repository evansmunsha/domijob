import { inngest } from "./client";
import { prisma } from "../db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface JobExpirationEvent {
  data: {
    jobId: string;
    expirationDays: number;
  };
}

interface JobseekerCreatedEvent {
  data: {
    userId: string;
    email: string;
  };
}


export const handleJobExpiration = inngest.createFunction(
  { id: "job-expiration", cancelOn: [
    {
      event: "job/cancel.expiration",
      if: "event.data.jobId == async.data.jobId"
    }
  ] },
  { event: "job/created" },
  async ({ event, step }: { event: JobExpirationEvent; step: any }) => {

    // Log the incoming event data
    console.log("Received event:", event);

    const { jobId, expirationDays } = event.data;

    // Wait for the specified duration
    await step.sleep("wait-for-expiration", `${expirationDays}d`);

    // Update job status to expired
    await step.run("update-job-status", async () => {
      await prisma.jobPost.update({
        where: { id: jobId },
        data: { status: "EXPIRED" },
      });
    });

    return { jobId, message: "Job marked as expired" };
  }
);

export const sendPeriodicJobListing = inngest.createFunction(
  { id: "send-job-listing" },
  { event: "jobseeker/created" },
  async ({ event, step }: { event: JobseekerCreatedEvent; step: any }) => {
    const { userId, email } = event.data;
    const baseUrl = process.env.NEXT_PUBLIC_URL; // Base URL for local development

    const totalDays = 30; // Total number of days to send job listings
    const intervalDays = 2; // Interval between job listings (every 2 days)

    for (let currentDay = 0; currentDay < totalDays; currentDay += intervalDays) {
      await step.sleep("wait-interval", `${intervalDays}d`);


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
              }
            }
          }
        });
      });

      if (recentJobs.length > 0) {
        await step.run("send-email", async () => {
          const jobListingsHtml = recentJobs.map((job: { company: { logo: any; name: any; }; id: any; jobTitle: any; location: any; salaryFrom: { toLocaleString: () => any; }; salaryTo: { toLocaleString: () => any; }; employmentType: any; }) => `
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
          `).join("");
          
          try {
            await resend.emails.send({
              from: 'MiJob <onboarding@resend.dev>',
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
            });
            console.log(`Email sent successfully to ${email}`);
          } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);
          }
        });
      } else {
        console.log(`No active job listings found for user ${userId}`);
      }
    }

    return { userId, email, message: "Completed 30 day job listing notifications" };
  }
);