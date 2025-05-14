import type { Metadata } from "next"
import { prisma } from "@/app/utils/db"
import JobIdPage from "./client-page"

// Generate dynamic metadata
export async function generateMetadata({ params }: { params: { jobId: string } }): Promise<Metadata> {
  try {
    const job = await prisma.jobPost.findUnique({
      // Changed from jobPost to job based on your schema
      where: { id: params.jobId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!job) {
      return {
        title: "Job Not Found | Domijob",
        description: "The job you're looking for could not be found.",
      }
    }

    // Strip HTML tags for description
    const plainDescription = job.jobDescription.replace(/<[^>]+>/g, "")

    return {
      title: `${job.jobTitle} at ${job.company.name} | Domijob`,
      description: `Apply for ${job.jobTitle} position at ${job.company.name}. ${plainDescription.substring(0, 150)}...`,
      openGraph: {
        title: `${job.jobTitle} at ${job.company.name}`,
        description: `Apply for ${job.jobTitle} position at ${job.company.name}. ${plainDescription.substring(0, 150)}...`,
        type: "website",
        url: `${process.env.NEXT_PUBLIC_URL}/job/${params.jobId}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${job.jobTitle} at ${job.company.name}`,
        description: `Apply for ${job.jobTitle} position at ${job.company.name}. ${plainDescription.substring(0, 150)}...`,
      },
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_URL}/job/${params.jobId}`,
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Job Details | Domijob",
      description: "View job details and apply on Domijob.",
    }
  }
}

export default function Page({ params }: { params: { jobId: string } }) {
  return <JobIdPage params={Promise.resolve({ jobId: params.jobId })} />
}

// Generate static params for popular jobs
export async function generateStaticParams() {
  const jobs = await prisma.jobPost.findMany({
    // Changed from jobPost to job based on your schema
    where: {
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "desc", // Changed from viewCount to createdAt which should exist in your schema
    },
    take: 20, // Pre-generate the 20 most recent jobs
    select: {
      id: true,
    },
  })

  return jobs.map((job) => ({
    jobId: job.id,
  }))
}
