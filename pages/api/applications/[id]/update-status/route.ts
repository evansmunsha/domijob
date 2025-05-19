import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

// Import the notification utilities
import { notifyUserOfApplicationStatusChange } from "@/app/utils/notifications"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params Promise to get the actual params
    const { id } = await context.params

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const applicationId = id
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Validate status - adjust these to match your actual status options
    const validStatuses = ["PENDING", "REVIEWING", "SHORTLISTED", "REJECTED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get the application
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        user: {
          include: {
            JobSeeker: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Verify the user is the company that posted the job
    const company = await prisma.company.findFirst({
      where: { userId: session.user.id },
    })

    if (!company || company.id !== application.job.companyId) {
      return NextResponse.json({ error: "You don't have permission to update this application" }, { status: 403 })
    }

    // Update the application status
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
    })

    // Replace the notification creation code with the utility function
    // Find the section where you create notifications for application status changes and replace with:
    // Create a notification for the job seeker
    await notifyUserOfApplicationStatusChange(application.userId, application.jobId, application.job.jobTitle, status)

    // Create a notification for the company (for record-keeping)
    await prisma.companyNotification.create({
      data: {
        companyId: company.id,
        jobId: application.jobId,
        type: "APPLICATION_STATUS_UPDATED",
        message: `Application status for ${application.user.JobSeeker?.name || "a candidate"} updated to ${status}`,
        read: false,
      },
    })

    // Log the notification creation
    console.log(`Created company notification for application status update`)

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json({ error: "Failed to update application status" }, { status: 500 })
  }
}

