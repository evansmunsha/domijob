import type { Metadata } from "next"




  export interface ConstructMetadataArgs {
    title?: string
    description?: string
    image?: string
    icons?: string
    noIndex?: boolean
    searchParams?: Record<string, string>
    ogType?: "article" | "website" | "book" | "profile" | "music.song" | "music.album" | "music.playlist" | "music.radio_station" | "video.movie" | "video.episode" | "video.tv_show" | "video.other"
  }
  

  export function constructMetadata({
    title = "Domijob | AI-Powered Job Board for Job Seekers & Recruiters",
    description = "Domijob is an AI-driven job board connecting job seekers and recruiters. Find your next opportunity or hire top talent efficiently.",
    image = "/logo.png",
    icons = "/favicon.ico",
    noIndex = false,
    searchParams = {},
    ogType = "website",
  }: ConstructMetadataArgs): Metadata {
    const base = process.env.NEXT_PUBLIC_URL || "https://domijob.vercel.app"
    const metadataBase = new URL(base)
  
    const refCode = searchParams?.ref
    const page = searchParams?.page
    const jobTypes = searchParams?.jobTypes
    const location = searchParams?.location
  
    const url = new URL(base)
    if (refCode) url.searchParams.set("ref", refCode)
    if (page) url.searchParams.set("page", page)
    if (jobTypes) url.searchParams.set("jobTypes", jobTypes)
    if (location) url.searchParams.set("location", location)
  
    const canonicalParams = new URLSearchParams({
      ...(page && { page }),
      ...(jobTypes && { jobTypes }),
      ...(location && { location }),
      ...(refCode && { ref: refCode }),
    }).toString()
  
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
        type: ogType,
        images: [
          {
            url: imageUrl.toString(),
            width: 1200,
            height: 630,
            alt: "Domijob AI-powered job matching illustration",
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
        canonical: `${base}${canonicalParams ? `?${canonicalParams}` : ""}`,
      },
    }
  }
  
