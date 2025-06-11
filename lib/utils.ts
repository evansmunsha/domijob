import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Metadata } from "next";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export function constructMetadata({
  title = "Domijob | AI-Powered Job Board for Job Seekers & Recruiters",
  description = "Domijob is an AI-driven job board connecting job seekers and recruiters. Find your next opportunity or hire top talent efficiently.",
  image = "/logo.png",
  icons = "/favicon.ico",
  noIndex = false,
  searchParams = {},
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
  searchParams?: Record<string, string>
}): Metadata {
  const base = process.env.NEXT_PUBLIC_URL || "https://domijob.vercel.app"
  const metadataBase = new URL(base)

  // Extract query parameters
  const { ref, page, jobTypes, location } = searchParams

  // Build URL for OG and canonical
  const url = new URL(base)
  if (ref) url.searchParams.set("ref", ref)
  if (page) url.searchParams.set("page", page)
  if (jobTypes) url.searchParams.set("jobTypes", jobTypes)
  if (location) url.searchParams.set("location", location)

  // Construct canonical URL with only meaningful params (excluding 'ref' for SEO)
  const canonicalParams = new URLSearchParams({
    ...(page && { page }),
    ...(jobTypes && { jobTypes }),
    ...(location && { location }),
  }).toString()

  const canonicalUrl = `${base}${canonicalParams ? `?${canonicalParams}` : ""}`
  const imageUrl = new URL(image, metadataBase)

  return {
    title,
    description,
    metadataBase,
    keywords: [
      "AI job board",
      "recruitment",
      "talent matching",
      "job search",
      "hiring",
      "career",
      "recruiters",
      "job seekers",
    ],
    verification: {
      google: "XoXKKpxJAqwZshDFMDfiTdq3NOjfVkZcCtbvUNQ0nVo",
    },
    robots: noIndex ? "noindex, nofollow" : "index, follow",
    openGraph: {
      title,
      description,
      url: url.toString(),
      siteName: "Domijob",
      type: "website",
      images: [
        {
          url: imageUrl.toString(),
          width: 1200,
          height: 630,
          alt: "Domijob AI-powered job matching illustration",
        },{
        url: "/og/resume-enhancer.png",
        width: 1200,
        height: 630,
        alt: "AI Resume Enhancer",
      },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl.toString()],
    },
    icons: {
      icon: icons,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}



 
