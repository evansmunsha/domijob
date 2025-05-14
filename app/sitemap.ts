import type { MetadataRoute } from "next"
import { prisma } from "@/app/utils/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://domijob.vercel.app"

  // Get all jobs
  const jobs = await prisma.jobPost.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
    where: {
      status: "ACTIVE",
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 1000, // Limit to 1000 most recent jobs
  })

  const jobEntries = jobs.map((job) => ({
    url: `${baseUrl}/job/${job.id}`,
    lastModified: job.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  // Get all companies
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
    take: 500, // Limit to 500 companies
  })

  const companyEntries = companies.map((company) => ({
    url: `${baseUrl}/companies/${company.id}`,
    lastModified: company.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    /* {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }, */
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ]

  return [...staticPages, ...jobEntries, ...companyEntries]
}
