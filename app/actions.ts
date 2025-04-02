"use server"
//@typescript-eslint/no-unused-vars
import { z } from "zod"
import { requireUser } from "./utils/hooks"
import { companySchema, jobSchema, jobSeekerSchema } from "./utils/zodSchemas"
import { prisma } from "./utils/db"
import { redirect } from "next/navigation"
import { stripe } from "./utils/stripe"
import { jobListingDurationPricing } from "./utils/pricingTiers"
import { revalidatePath } from "next/cache"
import arcjet, { detectBot, shield } from "./utils/arcjet"
import { request } from "@arcjet/next"
import { inngest } from "./utils/inngest/client"
import { auth } from "./utils/auth"
import { notifyCompanyOfNewApplication } from "./utils/notifications"

const aj = arcjet
  .withRule(
    shield({
      mode: "LIVE",
    }),
  )
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
  )

export async function createCompany(data: z.infer<typeof companySchema>) {
  const user = await requireUser()
  const req = await request()
  const decision = await aj.protect(req)

  if (decision.isDenied()) {
    throw new Error("Forbidden")
  }

  const validatedData = companySchema.parse(data)
  console.log("Received data:", data)
  console.log("Validated data:", validatedData)

  try {
    // Check if the company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { userId: user.id },
    })

    if (existingCompany) {
      // Update the existing company
      await prisma.company.update({
        where: { userId: user.id },
        data: validatedData,
      })
    } else {
      // Create a new company
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingCompleted: true,
          userType: "COMPANY",
          Company: {
            create: validatedData,
          },
        },
      })
    }
  } catch (error) {
    console.error("Error updating or creating company:", error)
    throw new Error("Failed to create or update company.")
  }

  return redirect("/")
}

export async function createJobSeeker(data: z.infer<typeof jobSeekerSchema>) {
  try {
    const user = await auth()

    if (!user?.user?.id) {
      throw new Error("You must be logged in to create a profile")
    }

    // Access the request object so Arcjet can analyze it
    const req = await request()
    // Call Arcjet protect
    const decision = await aj.protect(req)

    if (decision.isDenied()) {
      throw new Error("Your request was blocked for security reasons. Please try again later.")
    }

    // Validate the input data
    const validatedData = jobSeekerSchema.parse(data)

    // Check if user already has a profile
    const existingProfile = await prisma.jobSeeker.findUnique({
      where: { userId: user.user.id },
    })

    if (existingProfile) {
      // Update existing profile
      await prisma.jobSeeker.update({
        where: { userId: user.user.id },
        data: {
          name: validatedData.name,
          about: validatedData.about,
          resume: validatedData.resume,
          skills: validatedData.skills || [],
          languages: validatedData.languages || [],
        },
      })
    } else {
      // Create new profile by updating user and creating JobSeeker
      await prisma.user.update({
        where: {
          id: user.user.id,
        },
        data: {
          onboardingCompleted: true,
          userType: "JOB_SEEKER",
          JobSeeker: {
            create: {
              name: validatedData.name,
              about: validatedData.about,
              resume: validatedData.resume,
              skills: validatedData.skills || [],
              languages: validatedData.languages || [],
            },
          },
        },
      })
    }

    // Revalidate relevant paths
    revalidatePath("/profile")
    revalidatePath("/dashboard")
    revalidatePath("/jobs")

    // Redirect to the dashboard with a welcome message
    redirect("/dashboard?welcome=true")
  } catch (error) {
    console.error("Error creating job seeker profile:", error)
    throw error // Re-throw to handle in the client
  }
}

export async function createJob(data: z.infer<typeof jobSchema>) {
  const user = await requireUser()

  const validatedData = jobSchema.parse(data)

  const company = await prisma.company.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      user: {
        select: {
          stripeCustomerId: true,
        },
      },
    },
  })

  if (!company?.id) {
    return redirect("/")
  }

  let stripeCustomerId = company.user.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.name || undefined,
    })

    stripeCustomerId = customer.id

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    })
  }

  const jobPost = await prisma.jobPost.create({
    data: {
      companyId: company.id,
      jobDescription: validatedData.jobDescription,
      jobTitle: validatedData.jobTitle,
      employmentType: validatedData.employmentType,
      location: validatedData.location,
      salaryFrom: validatedData.salaryFrom,
      salaryTo: validatedData.salaryTo,
      listingDuration: validatedData.listingDuration,
      benefits: validatedData.benefits,
    },
  })

  // Trigger the job expiration function
  await inngest?.send({
    name: "job/created",
    data: {
      jobId: jobPost.id,
      expirationDays: validatedData.listingDuration,
    },
  })

  // Get price from pricing tiers based on duration
  const pricingTier = jobListingDurationPricing.find((tier) => tier.days === validatedData.listingDuration)

  if (!pricingTier) {
    throw new Error("Invalid listing duration selected")
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          product_data: {
            name: `Job Posting - ${pricingTier.days} Days`,
            description: pricingTier.description,
            images: ["https://pve1u6tfz1.ufs.sh/f/Ae8VfpRqE7c0gFltIEOxhiBIFftvV4DTM8a13LU5EyzGb2SQ"],
          },
          currency: "USD",
          unit_amount: pricingTier.price * 100, // Convert to cents for Stripe
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      jobId: jobPost.id,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
  })

  return redirect(session.url as string)
}

export async function updateJobPost(data: z.infer<typeof jobSchema>, jobId: string) {
  const user = await requireUser()

  // Access the request object so Arcjet can analyze it
  const req = await request()
  // Call Arcjet protect
  const decision = await aj.protect(req)

  if (decision.isDenied()) {
    throw new Error("Forbidden")
  }

  const validatedData = jobSchema.parse(data)

  await prisma.jobPost.update({
    where: {
      id: jobId,
      company: {
        userId: user.id,
      },
    },
    data: {
      jobDescription: validatedData.jobDescription,
      jobTitle: validatedData.jobTitle,
      employmentType: validatedData.employmentType,
      location: validatedData.location,
      salaryFrom: validatedData.salaryFrom,
      salaryTo: validatedData.salaryTo,
      listingDuration: validatedData.listingDuration,
      benefits: validatedData.benefits,
    },
  })

  return redirect("/my-jobs")
}

export async function deleteJobPost(jobId: string) {
  const user = await requireUser()

  // Access the request object so Arcjet can analyze it
  const req = await request()
  // Call Arcjet protect
  const decision = await aj.protect(req)

  if (decision.isDenied()) {
    throw new Error("Forbidden")
  }

  await prisma.jobPost.delete({
    where: {
      id: jobId,
      company: {
        userId: user.id,
      },
    },
  })

  // Fixed: Added await before inngest.send()
  await inngest.send({
    name: "job/cancel.expiration",
    data: { jobId: jobId },
  })

  return redirect("/my-jobs")
}

export async function applyForJob(jobId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to apply for a job")
  }

  // Check if the job exists
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: { company: true },
  })

  if (!job) {
    throw new Error("Job not found")
  }

  // Check if the user has already applied to this job
  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      userId_jobId: {
        userId: session.user.id,
        jobId,
      },
    },
  })

  if (existingApplication) {
    throw new Error("You have already applied to this job")
  }

  // Get the job seeker's name
  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  })

  if (!jobSeeker) {
    throw new Error("Job seeker profile not found. Please complete your profile first.")
  }

  // Create the application
  const application = await prisma.jobApplication.create({
    data: {
      userId: session.user.id,
      jobId,
      status: "PENDING",
    },
  })

  console.log(`Application created: ${application.id}`)

  // Fixed: Removed duplicate declaration of applicantName

  // Create a notification for the company
  try {
    const applicantName = jobSeeker.name || "A candidate"
    await notifyCompanyOfNewApplication(job.companyId, jobId, job.jobTitle, applicantName)
  } catch (notificationError) {
    // Log the error but don't fail the application
    console.error("Failed to create company notification:", notificationError)
  }

  revalidatePath(`/jobs/${jobId}`)
  return application
}

export async function saveJobPost(jobId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to save a job")
  }

  // Check if the job exists
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
  })

  if (!job) {
    throw new Error("Job not found")
  }

  // Check if the job is already saved
  const existingSave = await prisma.savedJobPost.findFirst({
    where: {
      userId: session.user.id,
      jobId,
    },
  })

  if (existingSave) {
    return existingSave
  }

  // Save the job
  const savedJob = await prisma.savedJobPost.create({
    data: {
      userId: session.user.id,
      jobId,
    },
  })

  revalidatePath(`/job/${jobId}`)
  return savedJob
}

export async function unsaveJobPost(savedJobId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to unsave a job")
  }

  // Check if the saved job exists and belongs to the user
  const savedJob = await prisma.savedJobPost.findFirst({
    where: {
      id: savedJobId,
      userId: session.user.id,
    },
    select: { jobId: true },
  })

  if (!savedJob) {
    throw new Error("Saved job not found")
  }

  // Delete the saved job
  await prisma.savedJobPost.delete({
    where: {
      id: savedJobId,
    },
  })

  revalidatePath(`/job/${savedJob.jobId}`)
  return { success: true }
}

type ApplicationStatus = "PENDING" | "REVIEWING" | "SHORTLISTED" | "REJECTED"

export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update application status")
  }

  // Verify the application belongs to the user's company
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job: {
        company: {
          userId: session.user.id,
        },
      },
    },
    include: {
      job: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!application) {
    throw new Error("Application not found or you don't have permission")
  }

  // Update the application status
  await prisma.jobApplication.update({
    where: {
      id: applicationId,
    },
    data: {
      status: status,
    },
  })

  // Revalidate the application pages
  revalidatePath(`/my-jobs/${application.job.id}/applications/${applicationId}`)
  revalidatePath(`/my-jobs/${application.job.id}/applications`)
}

// Update the profileSchema to include skills and languages
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  about: z.string().min(10, "Please provide more information about yourself"),
  email: z.string().email("Please enter a valid email"),
  skills: z.array(z.string().trim()).optional(),
  languages: z.array(z.string().trim()).optional(),
})

export async function updateProfile(userId: string, data: z.infer<typeof profileSchema>) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update your profile")
  }

  // Verify the user has permission to update this profile
  if (session.user.id !== userId) {
    throw new Error("You don't have permission to update this profile")
  }

  // Validate the input data
  const validatedData = profileSchema.parse(data)

  // Update the user record with email
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: validatedData.email,
    },
  })

  // Update the job seeker profile
  await prisma.jobSeeker.update({
    where: { userId: userId },
    data: {
      name: validatedData.name,
      about: validatedData.about,
      skills: validatedData.skills,
      languages: validatedData.languages,
    },
  })

  // Revalidate relevant paths
  revalidatePath("/profile")
  revalidatePath("/dashboard")
}

export async function updateSkills(userId: string, skills: string[]) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update your skills")
  }

  // Verify the user has permission to update this profile
  if (session.user.id !== userId) {
    throw new Error("You don't have permission to update these skills")
  }

  // Update the job seeker profile with the new skills
  await prisma.jobSeeker.update({
    where: { userId: userId },
    data: {
      skills: skills,
    },
  })

  // Revalidate relevant paths
  revalidatePath("/profile")
  revalidatePath("/dashboard")
  revalidatePath(`/job-seekers/${userId}`)
}

export async function updateLanguages(userId: string, languages: string[]) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update your languages")
  }

  // Verify the user has permission to update this profile
  if (session.user.id !== userId) {
    throw new Error("You don't have permission to update these languages")
  }

  // Update the job seeker profile with the new languages
  await prisma.jobSeeker.update({
    where: { userId: userId },
    data: {
      languages: languages,
    },
  })

  // Revalidate relevant paths
  revalidatePath("/profile")
  revalidatePath("/dashboard")
  revalidatePath(`/job-seekers/${userId}`)
}

export async function updateResume(userId: string, resumeUrl: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update your resume")
  }

  // Verify the user has permission to update this profile
  if (session.user.id !== userId) {
    throw new Error("You don't have permission to update this resume")
  }

  // Validate the resume URL if it's not empty
  if (resumeUrl) {
    jobSeekerSchema.shape.resume.parse(resumeUrl)
  }

  // Update the job seeker profile with the new resume URL
  await prisma.jobSeeker.update({
    where: { userId: userId },
    data: {
      resume: resumeUrl,
    },
  })

  // Revalidate relevant paths
  revalidatePath("/profile")
  revalidatePath("/dashboard")
}

